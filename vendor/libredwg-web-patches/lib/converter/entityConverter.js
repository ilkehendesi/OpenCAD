import { DwgBoundaryPathEdgeType, DwgHatchAssociativity, DwgHatchGradientColorFlag, DwgHatchGradientFlag, DwgHatchSolidFill } from '../database';
import { Dwg_Hatch_Edge_Type, Dwg_Object_Type } from '../types';
import { dwgColorToMLeaderRawColor } from './dwgColorToMLeaderRawColor';
import { decodeOle2FrameCornersFromData, idToString, uint8ArrayToHexString } from './utils';
export class LibreEntityConverter {
    libredwg;
    layers = new Map();
    ltypes = new Map();
    classes = [];
    unknownEntityCount;
    constructor(instance) {
        this.libredwg = instance;
        this.unknownEntityCount = 0;
    }
    prepare(db, force = false) {
        if (force || this.layers.size == 0) {
            this.layers.clear();
            db.tables.LAYER.entries.forEach(layer => {
                this.layers.set(layer.handle, layer.name);
            });
        }
        if (force || this.ltypes.size == 0) {
            this.ltypes.clear();
            db.tables.LTYPE.entries.forEach(ltype => {
                this.ltypes.set(ltype.handle, ltype.name);
            });
        }
        this.classes = db.classes;
        this.unknownEntityCount = 0;
    }
    setClasses(classes) {
        this.classes = classes;
    }
    clear() {
        this.layers.clear();
        this.ltypes.clear();
        this.classes = [];
        this.unknownEntityCount = 0;
    }
    convert(object_ptr) {
        const libredwg = this.libredwg;
        // Get values of the common attributes of one entity
        const entity = libredwg.dwg_object_to_entity(object_ptr);
        const entity_tio = libredwg.dwg_object_to_entity_tio(object_ptr);
        if (entity && entity_tio) {
            // Get values of the common attributes of one entity
            const commonAttrs = this.getCommonAttrs(entity);
            const fixedtype = libredwg.dwg_object_get_fixedtype(object_ptr);
            if (fixedtype == Dwg_Object_Type.DWG_TYPE_3DFACE) {
                return this.convert3dFace(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_3DSOLID) {
                return this.convert3dSolid(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ARC) {
                return this.convertArc(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ARCALIGNEDTEXT) {
                return this.convertArcAlignedText(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ATTDEF) {
                return this.convertAttdef(entity_tio, commonAttrs);
                // libredwg stores ATTRIB as children of one INSERT entity.
                // It does not exist in iterator of dwg data.
                // } else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ATTRIB) {
                //   return this.convertAttrib(entity_tio, commonAttrs)
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_CIRCLE) {
                return this.convertCircle(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ALIGNED ||
                fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_LINEAR) {
                return this.convertAlignedDimension(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ANG3PT) {
                return this.convert3PointAngularDimension(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ANG2LN) {
                return this.convert2LineAngularDimension(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_DIAMETER) {
                return this.convertDiameterDimension(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_ORDINATE) {
                return this.convertOrdinateDimension(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_DIMENSION_RADIUS) {
                return this.convertRadiusDimension(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_ELLIPSE) {
                return this.convertEllise(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_HATCH) {
                return this.convertHatch(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_IMAGE) {
                return this.convertImage(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_INSERT) {
                return this.convertInsert(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_LEADER) {
                return this.convertLeader(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_LINE) {
                return this.convertLine(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_LWPOLYLINE) {
                return this.convertLWPolyline(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_MLINE) {
                return this.convertMLine(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_MULTILEADER) {
                return this.convertMultiLeader(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_MTEXT) {
                return this.convertMText(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_OLE2FRAME) {
                return this.convertOle2Frame(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_OLEFRAME) {
                return this.convertOleFrame(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_POINT) {
                return this.convertPoint(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_POLYLINE_2D) {
                return this.convertPolyline2d(entity_tio, commonAttrs, object_ptr);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_POLYLINE_3D) {
                return this.convertPolyline3d(entity_tio, commonAttrs, object_ptr);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_PROXY_ENTITY) {
                return this.convertProxyEntity(entity_tio, commonAttrs, object_ptr);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_RAY) {
                return this.convertRay(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SECTIONOBJECT) {
                return this.convertSection(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SHAPE) {
                return this.convertShape(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SOLID) {
                return this.convertSolid(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TRACE) {
                return this.convertTrace(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_SPLINE) {
                return this.convertSpline(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TABLE) {
                return this.convertTable(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TEXT) {
                return this.convertText(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_TOLERANCE) {
                return this.convertTolerance(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_VIEWPORT) {
                return this.convertViewport(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_WIPEOUT) {
                return this.convertWipeout(entity_tio, commonAttrs);
            }
            else if (fixedtype == Dwg_Object_Type.DWG_TYPE_XLINE) {
                return this.convertXline(entity_tio, commonAttrs);
            }
            else if (fixedtype === Dwg_Object_Type.DWG_TYPE_UNKNOWN_ENT) {
                this.unknownEntityCount++;
            }
        }
        return undefined;
    }
    convert3dFace(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const corner1 = libredwg.dwg_dynapi_entity_data(entity, 'corner1');
        const corner2 = libredwg.dwg_dynapi_entity_data(entity, 'corner2');
        const corner3 = libredwg.dwg_dynapi_entity_data(entity, 'corner3');
        const corner4 = libredwg.dwg_dynapi_entity_data(entity, 'corner4');
        const flag = libredwg.dwg_dynapi_entity_data(entity, 'invis_flags');
        return {
            type: '3DFACE',
            ...commonAttrs,
            corner1: corner1,
            corner2: corner2,
            corner3: corner3,
            corner4: corner4,
            flag: flag
        };
    }
    convert3dSolid(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const version = libredwg.dwg_dynapi_entity_data(entity, 'version');
        const satCache = libredwg.dwg_dynapi_entity_data(entity, 'acis_empty');
        const data = libredwg.dwg_dynapi_entity_data(entity, 'acis_data');
        const hasRevisionGuid = libredwg.dwg_dynapi_entity_data(entity, 'has_revision_guid');
        const historyRef = libredwg.dwg_dynapi_entity_data(entity, 'history_id');
        const historyObjectSoftId = libredwg.dwg_ref_get_id(historyRef);
        const result = {
            type: '3DSOLID',
            subclassMarker: 'AcDb3dSolid',
            ...commonAttrs
        };
        if (version) {
            result.version = version;
        }
        result.satCache = satCache;
        if (data) {
            result.data = data;
        }
        if (hasRevisionGuid) {
            const guidOffset = libredwg.dwg_dynapi_entity_field_offset(entity, 'revision_guid');
            if (guidOffset >= 0) {
                const guid = libredwg.UTF8ToString(entity + guidOffset, 38);
                if (guid) {
                    result.guid = guid;
                }
            }
        }
        if (historyObjectSoftId) {
            result.historyObjectSoftId = historyObjectSoftId;
        }
        return result;
    }
    convertArc(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const center = libredwg.dwg_dynapi_entity_data(entity, 'center');
        const radius = libredwg.dwg_dynapi_entity_data(entity, 'radius');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const startAngle = libredwg.dwg_dynapi_entity_data(entity, 'start_angle');
        const endAngle = libredwg.dwg_dynapi_entity_data(entity, 'end_angle');
        return {
            type: 'ARC',
            ...commonAttrs,
            thickness: thickness,
            center: center,
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle,
            extrusionDirection: extrusionDirection
        };
    }
    convertArcAlignedText(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const numberField = (field, fallback = 0) => {
            const value = libredwg.dwg_dynapi_entity_data(entity, field);
            if (typeof value === 'number' && Number.isFinite(value))
                return value;
            if (typeof value === 'string' && value.trim() !== '') {
                const parsed = Number(value);
                if (Number.isFinite(parsed))
                    return parsed;
            }
            return fallback;
        };
        const center = libredwg.dwg_dynapi_entity_data(entity, 'center');
        const extrusion = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const arcRef = libredwg.dwg_dynapi_entity_data(entity, 'arc_handle');
        const xScale = numberField('xscale', 1);
        return {
            type: 'ARCALIGNEDTEXT',
            ...commonAttrs,
            text: libredwg.dwg_dynapi_entity_data(entity, 'text_value') ?? '',
            textSize: numberField('text_size'),
            xScale: xScale > 0 ? xScale : 1,
            characterSpacing: numberField('char_spacing'),
            styleName: libredwg.dwg_dynapi_entity_data(entity, 'style') ?? '',
            fontName: libredwg.dwg_dynapi_entity_data(entity, 'font_name') ?? '',
            bigFontName: libredwg.dwg_dynapi_entity_data(entity, 'bigfont_name') ?? '',
            offsetFromArc: numberField('offset_from_arc'),
            rightOffset: numberField('right_offset'),
            leftOffset: numberField('left_offset'),
            center: center ?? { x: 0, y: 0, z: 0 },
            radius: libredwg.dwg_dynapi_entity_data(entity, 'radius') ?? 0,
            startAngle: libredwg.dwg_dynapi_entity_data(entity, 'start_angle') ?? 0,
            endAngle: libredwg.dwg_dynapi_entity_data(entity, 'end_angle') ?? 0,
            extrusionDirection: extrusion ?? { x: 0, y: 0, z: 1 },
            rawTextColor: libredwg.dwg_dynapi_entity_data(entity, 'color') ?? 256,
            characterSet: libredwg.dwg_dynapi_entity_data(entity, 'character_set') ?? 0,
            pitchAndFamily: libredwg.dwg_dynapi_entity_data(entity, 'pitch_and_family') ?? 0,
            isShx: (libredwg.dwg_dynapi_entity_data(entity, 'is_shx') ?? 0) !== 0,
            isBold: (libredwg.dwg_dynapi_entity_data(entity, 'is_bold') ?? 0) !== 0,
            isItalic: (libredwg.dwg_dynapi_entity_data(entity, 'is_italic') ?? 0) !== 0,
            isUnderlined: (libredwg.dwg_dynapi_entity_data(entity, 'is_underlined') ?? 0) !== 0,
            alignment: libredwg.dwg_dynapi_entity_data(entity, 'alignment') ?? 0,
            isReverse: (libredwg.dwg_dynapi_entity_data(entity, 'is_reverse') ?? 0) !== 0,
            wizardFlag: libredwg.dwg_dynapi_entity_data(entity, 'wizard_flag') ?? 0,
            textPosition: libredwg.dwg_dynapi_entity_data(entity, 'text_position') ?? 1,
            textDirection: libredwg.dwg_dynapi_entity_data(entity, 'text_direction') ?? 1,
            arcHandle: arcRef ? (libredwg.dwg_ref_get_id(arcRef) ?? '') : ''
        };
    }
    convertEmbeddedMText(entity, subclassName) {
        const libredwg = this.libredwg;
        const attachmentPoint = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'attachment');
        const insertionPoint = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'ins_pt');
        const direction = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'x_axis_dir');
        const rectHeight = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'rect_height');
        const rectWidth = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'rect_width');
        const extentsHeight = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'extents_height');
        const extentsWidth = libredwg.dwg_dynapi_subclass_data(entity, subclassName, 'extents_width');
        // const columnType = libredwg.dwg_dynapi_subclass_value(entity, subclassName, 'column_type')
        //   .data as number
        // const columnWidth = libredwg.dwg_dynapi_subclass_value(entity, subclassName, 'column_width')
        //   .data as number
        // const columnGutter = libredwg.dwg_dynapi_subclass_value(entity, subclassName, 'gutter')
        //   .data as number
        // const columnAutoHeight = libredwg.dwg_dynapi_subclass_value(
        //     entity,
        //     subclassName,
        //     'auto_height'
        //   ).data as number
        // const columnFlowReversed = libredwg.dwg_dynapi_subclass_value(
        //     entity,
        //     subclassName,
        //     'flow_reversed'
        //   ).data as number
        // const columnHeightCount = libredwg.dwg_dynapi_subclass_value(
        //   entity,
        //   subclassName,
        //   'num_column_heights'
        // ).data as number
        // const columnHeights_ptr = libredwg.dwg_dynapi_subclass_value(
        //   entity,
        //   subclassName,
        //   'column_heights'
        // ).data as number
        // const columnHeights = libredwg.dwg_ptr_to_double_array(
        //   columnHeights_ptr,
        //   columnHeightCount
        // )
        return {
            insertionPoint: insertionPoint,
            rectHeight: rectHeight,
            rectWidth: rectWidth,
            extentsHeight: extentsHeight,
            extentsWidth: extentsWidth,
            attachmentPoint: attachmentPoint,
            direction: direction
            // columnType: columnType,
            // columnFlowReversed: columnFlowReversed,
            // columnAutoHeight: columnAutoHeight,
            // columnWidth: columnWidth,
            // columnGutter: columnGutter,
            // columnHeightCount: columnHeightCount,
            // columnHeights: columnHeights
        };
    }
    convertAttdef(entity, commonAttrs) {
        const libredwg = this.libredwg;
        // Because the field name of text string in Dwg_Entity_ATTDEF is 'default_value'
        // instead of 'text_value'. So we need to get its value again using the correct
        // field name.
        const textValue = libredwg.dwg_dynapi_entity_data(entity, 'default_value');
        const text = this.convertTextBase(entity);
        text.text = textValue;
        const prompt = libredwg.dwg_dynapi_entity_data(entity, 'prompt');
        const tag = libredwg.dwg_dynapi_entity_data(entity, 'tag');
        const flags = libredwg.dwg_dynapi_entity_data(entity, 'flags');
        const fieldLength = libredwg.dwg_dynapi_entity_data(entity, 'field_length');
        const lockPositionFlag = libredwg.dwg_dynapi_entity_data(entity, 'lock_position_flag');
        const duplicateRecordCloningFlag = libredwg.dwg_dynapi_entity_data(entity, 'keep_duplicate_records');
        const isReallyLocked = libredwg.dwg_dynapi_entity_data(entity, 'is_really_locked');
        // TODO: double check whether 'mtext_type' is 'mtextFlag'
        const mtextFlag = libredwg.dwg_dynapi_entity_data(entity, 'mtext_type');
        const alignmentPoint = libredwg.dwg_dynapi_entity_data(entity, 'alignment_pt');
        return {
            type: 'ATTDEF',
            ...commonAttrs,
            text: this.convertTextBase(entity),
            prompt: prompt,
            tag: tag,
            flags: flags,
            fieldLength: fieldLength,
            lockPositionFlag: lockPositionFlag > 0,
            duplicateRecordCloningFlag: duplicateRecordCloningFlag > 0,
            mtextFlag: mtextFlag,
            isReallyLocked: isReallyLocked > 0,
            alignmentPoint: alignmentPoint,
            annotationScale: 1, // TODO: Set the correct value
            attrTag: '', // TODO: Set the correct value
            mtext: this.convertEmbeddedMText(entity, 'ATTDEF_mtext')
        };
    }
    convertAttrib(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const text = this.convertTextBase(entity);
        const tag = libredwg.dwg_dynapi_entity_data(entity, 'tag');
        const flags = libredwg.dwg_dynapi_entity_data(entity, 'flags');
        const fieldLength = libredwg.dwg_dynapi_entity_data(entity, 'field_length');
        const lockPositionFlag = libredwg.dwg_dynapi_entity_data(entity, 'lock_position_flag');
        const duplicateRecordCloningFlag = libredwg.dwg_dynapi_entity_data(entity, 'keep_duplicate_records');
        // TODO: double check whether 'mtext_type' is 'mtextFlag'
        const mtextFlag = libredwg.dwg_dynapi_entity_data(entity, 'mtext_type');
        const isReallyLocked = libredwg.dwg_dynapi_entity_data(entity, 'is_really_locked');
        const alignmentPoint = libredwg.dwg_dynapi_entity_data(entity, 'alignment_pt');
        return {
            type: 'ATTRIB',
            ...commonAttrs,
            text: text,
            tag: tag,
            flags: flags,
            fieldLength: fieldLength,
            lockPositionFlag: !!lockPositionFlag,
            duplicateRecordCloningFlag: !!duplicateRecordCloningFlag,
            mtextFlag: mtextFlag,
            isReallyLocked: !!isReallyLocked,
            numberOfSecondaryAttrs: 0, // TODO: libredwg doesn't support it yet.
            secondaryAttrsHardId: '0', // TODO: libredwg doesn't support it yet.
            alignmentPoint: { ...alignmentPoint, z: 0 },
            annotationScale: 1, // TODO: Set the correct value
            attrTag: '', // TODO: Set the correct value
            mtext: this.convertEmbeddedMText(entity, 'ATTDEF_mtext')
        };
    }
    convertCircle(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const center = libredwg.dwg_dynapi_entity_data(entity, 'center');
        const radius = libredwg.dwg_dynapi_entity_data(entity, 'radius');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        return {
            type: 'CIRCLE',
            ...commonAttrs,
            thickness: thickness,
            center: center,
            radius: radius,
            extrusionDirection: extrusionDirection
        };
    }
    convertAlignedDimension(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
        // TODO: Not sure whether 'clone_ins_pt' is same as 'insertionPoint'
        const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, 'clone_ins_pt');
        const subDefinitionPoint1 = libredwg.dwg_dynapi_entity_data(entity, 'xline1_pt');
        const subDefinitionPoint2 = libredwg.dwg_dynapi_entity_data(entity, 'xline2_pt');
        const rotationAngle = libredwg.dwg_dynapi_entity_data(entity, 'ins_rotation');
        const obliqueAngle = libredwg.dwg_dynapi_entity_data(entity, 'oblique_angle');
        return {
            subclassMarker: 'AcDbAlignedDimension',
            ...commonAttrs,
            ...dimensionCommonAttrs,
            insertionPoint: insertionPoint,
            subDefinitionPoint1: subDefinitionPoint1,
            subDefinitionPoint2: subDefinitionPoint2,
            rotationAngle: rotationAngle == null ? 0 : rotationAngle,
            obliqueAngle: obliqueAngle
        };
    }
    convert3PointAngularDimension(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
        const subDefinitionPoint1 = libredwg.dwg_dynapi_entity_data(entity, 'xline1_pt');
        const subDefinitionPoint2 = libredwg.dwg_dynapi_entity_data(entity, 'xline2_pt');
        const centerPoint = libredwg.dwg_dynapi_entity_data(entity, 'center_pt');
        const arcPoint = libredwg.dwg_dynapi_entity_data(entity, 'xline2end_pt');
        return {
            subclassMarker: 'AcDb3PointAngularDimension',
            ...commonAttrs,
            ...dimensionCommonAttrs,
            subDefinitionPoint1: subDefinitionPoint1,
            subDefinitionPoint2: subDefinitionPoint2,
            centerPoint: centerPoint,
            arcPoint: arcPoint
        };
    }
    convert2LineAngularDimension(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
        const xline1Start = libredwg.dwg_dynapi_entity_data(entity, 'xline1start_pt');
        const xline1End = libredwg.dwg_dynapi_entity_data(entity, 'xline1end_pt');
        const xline2Start = libredwg.dwg_dynapi_entity_data(entity, 'xline2start_pt');
        const xline2End = libredwg.dwg_dynapi_entity_data(entity, 'xline2end_pt');
        const vertexPoint = libredwg.dwg_dynapi_entity_data(entity, 'def_pt');
        // For 2-line angular dimensions DXF group 10 is the arc location (xline2end_pt),
        // not def_pt which stores the dimension line location (DXF group 16).
        if (xline2End) {
            dimensionCommonAttrs.definitionPoint = xline2End;
        }
        return {
            subclassMarker: 'AcDb2LineAngularDimension',
            ...commonAttrs,
            ...dimensionCommonAttrs,
            subDefinitionPoint1: xline1Start ?? xline1End ?? vertexPoint ?? xline2End,
            subDefinitionPoint2: xline2Start ?? xline2End ?? vertexPoint ?? xline1End,
            centerPoint: vertexPoint ?? xline2Start ?? xline1End ?? xline2End,
            arcPoint: xline2End ?? dimensionCommonAttrs.definitionPoint
        };
    }
    convertDiameterDimension(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
        // TODO: Not sure whether 'first_arc_pt' is same as 'centerPoint'
        const centerPoint = libredwg.dwg_dynapi_entity_data(entity, 'first_arc_pt');
        const leaderLength = libredwg.dwg_dynapi_entity_data(entity, 'leader_len');
        return {
            subclassMarker: 'AcDbDiametricDimension',
            ...commonAttrs,
            ...dimensionCommonAttrs,
            centerPoint: centerPoint,
            leaderLength: leaderLength
        };
    }
    convertOrdinateDimension(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
        // TODO: Not sure whether 'feature_location_pt' is same as 'subDefinitionPoint1'
        const subDefinitionPoint1 = libredwg.dwg_dynapi_entity_data(entity, 'feature_location_pt');
        // TODO: Not sure whether 'leader_endpt' is same as 'subDefinitionPoint2'
        const subDefinitionPoint2 = libredwg.dwg_dynapi_entity_data(entity, 'leader_endpt');
        return {
            subclassMarker: 'AcDbOrdinateDimension',
            ...commonAttrs,
            ...dimensionCommonAttrs,
            subDefinitionPoint1: subDefinitionPoint1,
            subDefinitionPoint2: subDefinitionPoint2
        };
    }
    convertRadiusDimension(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const dimensionCommonAttrs = this.getDimensionCommonAttrs(entity);
        // TODO: Not sure whether 'first_arc_pt' is same as 'centerPoint'
        const centerPoint = libredwg.dwg_dynapi_entity_data(entity, 'first_arc_pt');
        const leaderLength = libredwg.dwg_dynapi_entity_data(entity, 'leader_len');
        return {
            subclassMarker: 'AcDbRadialDimension',
            ...commonAttrs,
            ...dimensionCommonAttrs,
            centerPoint: centerPoint,
            leaderLength: leaderLength
        };
    }
    convertEllise(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const center = libredwg.dwg_dynapi_entity_data(entity, 'center');
        const majorAxisEndPoint = libredwg.dwg_dynapi_entity_data(entity, 'sm_axis');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const axisRatio = libredwg.dwg_dynapi_entity_data(entity, 'axis_ratio');
        const startAngle = libredwg.dwg_dynapi_entity_data(entity, 'start_angle');
        const endAngle = libredwg.dwg_dynapi_entity_data(entity, 'end_angle');
        return {
            type: 'ELLIPSE',
            ...commonAttrs,
            center: center,
            majorAxisEndPoint: majorAxisEndPoint,
            extrusionDirection: extrusionDirection,
            axisRatio: axisRatio,
            startAngle: startAngle,
            endAngle: endAngle
        };
    }
    convertHatch(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const patternName = libredwg.dwg_dynapi_entity_data(entity, 'name');
        const isSolidFill = libredwg.dwg_dynapi_entity_data(entity, 'is_solid_fill');
        const isAssociative = libredwg.dwg_dynapi_entity_data(entity, 'is_associative');
        const numberOfBoundaryPaths = libredwg.dwg_dynapi_entity_data(entity, 'num_paths');
        const paths_ptr = libredwg.dwg_dynapi_entity_data(entity, 'paths');
        const boundaryPaths = libredwg.dwg_ptr_to_hatch_path_array(paths_ptr, numberOfBoundaryPaths);
        const patternStyle = libredwg.dwg_dynapi_entity_data(entity, 'style');
        const patternType = libredwg.dwg_dynapi_entity_data(entity, 'pattern_type');
        const patternAngle = libredwg.dwg_dynapi_entity_data(entity, 'angle');
        const patternScale = libredwg.dwg_dynapi_entity_data(entity, 'scale_spacing');
        const numberOfDefinitionLines = libredwg.dwg_dynapi_entity_data(entity, 'num_deflines');
        const definitionLines_ptr = libredwg.dwg_dynapi_entity_data(entity, 'deflines');
        const definitionLines = libredwg.dwg_ptr_to_hatch_defline_array(definitionLines_ptr, numberOfDefinitionLines);
        const pixelSize = libredwg.dwg_dynapi_entity_data(entity, 'pixel_size');
        const numberOfSeedPoints = libredwg.dwg_dynapi_entity_data(entity, 'num_seeds');
        const seedPoints_ptr = libredwg.dwg_dynapi_entity_data(entity, 'seeds');
        const seedPoints = libredwg.dwg_ptr_to_point2d_array(seedPoints_ptr, numberOfSeedPoints);
        const result = {
            ...commonAttrs,
            // elevationPoint: DwgPoint3D
            extrusionDirection: extrusionDirection,
            patternName: patternName,
            solidFill: isSolidFill
                ? DwgHatchSolidFill.SolidFill
                : DwgHatchSolidFill.PatternFill,
            // patternFillColor: number
            associativity: isAssociative
                ? DwgHatchAssociativity.Associative
                : DwgHatchAssociativity.NonAssociative,
            numberOfBoundaryPaths: numberOfBoundaryPaths,
            boundaryPaths: this.convertHatchBoundaryPaths(boundaryPaths),
            hatchStyle: patternStyle,
            patternType: patternType,
            patternAngle: patternAngle,
            patternScale: patternScale,
            numberOfDefinitionLines: numberOfDefinitionLines,
            definitionLines: definitionLines.map(value => {
                return {
                    angle: value.angle,
                    base: value.pt0,
                    offset: value.offset,
                    numberOfDashLengths: value.dashes.length,
                    dashLengths: value.dashes
                };
            }),
            pixelSize: pixelSize,
            numberOfSeedPoints: numberOfSeedPoints,
            // offsetVector?: DwgPoint3D
            seedPoints: seedPoints
            // gradientFlag?: DwgHatchGradientFlag
        };
        const gradientFlag = libredwg.dwg_dynapi_entity_data(entity, 'is_gradient_fill');
        if (gradientFlag > 0) {
            const gradientName = libredwg.dwg_dynapi_entity_data(entity, 'gradient_name');
            const gradientRotation = libredwg.dwg_dynapi_entity_data(entity, 'gradient_angle');
            const gradientDefinition = libredwg.dwg_dynapi_entity_data(entity, 'gradient_shift');
            const colorTint = libredwg.dwg_dynapi_entity_data(entity, 'gradient_tint');
            const gradientColorFlag = libredwg.dwg_dynapi_entity_data(entity, 'single_color_gradient');
            // const numberOfColors = libredwg.dwg_dynapi_entity_value(entity, 'num_colors')
            //   .data as number
            const gradientColors_ptr = libredwg.dwg_dynapi_entity_data(entity, 'colors');
            const gradientColors = libredwg.dwg_ptr_to_hatch_gradient_color_array(gradientColors_ptr, (gradientColorFlag == 1) ? 1 : 2);
            return {
                type: 'HATCH',
                ...result,
                gradientFlag: DwgHatchGradientFlag.Gradient,
                gradientColorFlag: gradientColorFlag == 1 ? DwgHatchGradientColorFlag.OneColor : DwgHatchGradientColorFlag.TwoColor,
                gradientName,
                gradientRotation,
                gradientDefinition,
                colorTint,
                gradientColors
            };
        }
        else {
            return {
                type: 'HATCH',
                ...result
            };
        }
    }
    convertHatchBoundaryPaths(paths) {
        const converted = paths
            .filter(path => path.num_segs_or_paths > 0)
            .map(path => {
            const commonAttrs = {
                boundaryPathTypeFlag: path.flag
            };
            // Check whether it is a polyline
            if (path.flag & 0x02) {
                return {
                    ...commonAttrs,
                    hasBulge: path.bulges_present,
                    isClosed: path.closed,
                    numberOfVertices: path.num_segs_or_paths,
                    vertices: path.polyline_paths.map(vertex => {
                        return {
                            x: vertex.point.x,
                            y: vertex.point.y,
                            bulge: vertex.bulge
                        };
                    })
                };
            }
            else {
                const edges = path.segs.map(seg => {
                    if (seg.curve_type == Dwg_Hatch_Edge_Type.Line) {
                        return {
                            type: DwgBoundaryPathEdgeType.Line,
                            start: seg.first_endpoint,
                            end: seg.second_endpoint
                        };
                    }
                    else if (seg.curve_type == Dwg_Hatch_Edge_Type.CircularArc) {
                        return {
                            type: DwgBoundaryPathEdgeType.Circular,
                            center: seg.center,
                            radius: seg.radius,
                            startAngle: seg.start_angle,
                            endAngle: seg.end_angle,
                            isCCW: seg.is_ccw
                        };
                    }
                    else if (seg.curve_type == Dwg_Hatch_Edge_Type.EllipticArc) {
                        return {
                            type: DwgBoundaryPathEdgeType.Elliptic,
                            center: seg.center,
                            end: seg.endpoint,
                            lengthOfMinorAxis: seg.minor_major_ratio,
                            startAngle: seg.start_angle,
                            endAngle: seg.end_angle,
                            isCCW: seg.is_ccw
                        };
                    }
                    else if (seg.curve_type == Dwg_Hatch_Edge_Type.Spline) {
                        return {
                            type: DwgBoundaryPathEdgeType.Spline,
                            degree: seg.degree,
                            isRational: seg.is_rational,
                            isPeriodic: seg.is_periodic,
                            numberOfKnots: seg.num_knots,
                            numberOfControlPoints: seg.num_control_points,
                            knots: seg.knots,
                            controlPoints: seg.control_points,
                            numberOfFitData: seg.num_fitpts,
                            fitDatum: seg.fitpts,
                            startTangent: seg.start_tangent,
                            endTangent: seg.end_tangent
                        };
                    }
                });
                return {
                    ...commonAttrs,
                    numberOfEdges: path.num_segs_or_paths,
                    edges: edges
                };
            }
        });
        return converted;
    }
    convertImage(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const version = libredwg.dwg_dynapi_entity_data(entity, 'class_version');
        const position = libredwg.dwg_dynapi_entity_data(entity, 'pt0');
        const uPixel = libredwg.dwg_dynapi_entity_data(entity, 'uvec');
        const vPixel = libredwg.dwg_dynapi_entity_data(entity, 'vvec');
        const imageSize = libredwg.dwg_dynapi_entity_data(entity, 'image_size');
        const flags = libredwg.dwg_dynapi_entity_data(entity, 'display_props');
        const clipping = libredwg.dwg_dynapi_entity_data(entity, 'clipping');
        const brightness = libredwg.dwg_dynapi_entity_data(entity, 'brightness');
        const contrast = libredwg.dwg_dynapi_entity_data(entity, 'contrast');
        const fade = libredwg.dwg_dynapi_entity_data(entity, 'fade');
        const clipMode = libredwg.dwg_dynapi_entity_data(entity, 'clip_mode');
        const clippingBoundaryType = libredwg.dwg_dynapi_entity_data(entity, 'clip_boundary_type');
        const countBoundaryPoints = libredwg.dwg_dynapi_entity_data(entity, 'num_clip_verts');
        const clip_verts = libredwg.dwg_dynapi_entity_data(entity, 'clip_verts');
        const clippingBoundaryPath = libredwg.dwg_ptr_to_point3d_array(clip_verts, countBoundaryPoints);
        const imagedef_ref = libredwg.dwg_dynapi_entity_data(entity, 'imagedef');
        const imageDefHandle = (libredwg.dwg_ref_get_id(imagedef_ref) ?? '');
        const imagedefreactor_ref = libredwg.dwg_dynapi_entity_data(entity, 'imagedefreactor');
        const imageDefReactorHandle = (libredwg.dwg_ref_get_id(imagedefreactor_ref) ?? '');
        return {
            type: 'IMAGE',
            ...commonAttrs,
            version: version,
            position: position,
            uPixel: uPixel,
            vPixel: vPixel,
            imageSize: imageSize,
            imageDefHandle: imageDefHandle,
            flags: flags,
            clipping: clipping,
            brightness: brightness,
            contrast: contrast,
            fade: fade,
            imageDefReactorHandle: imageDefReactorHandle,
            clippingBoundaryType: clippingBoundaryType,
            countBoundaryPoints: countBoundaryPoints,
            clippingBoundaryPath: clippingBoundaryPath,
            clipMode: clipMode
        };
    }
    convertInsert(entity, commonAttrs) {
        const libredwg = this.libredwg;
        // Get block name
        let name = '';
        const block_header_ref = libredwg.dwg_dynapi_entity_data(entity, 'block_header');
        if (block_header_ref) {
            const block_header_obj = libredwg.dwg_ref_get_object(block_header_ref);
            if (block_header_obj) {
                const block_header_tio = libredwg.dwg_object_to_object_tio(block_header_obj);
                if (block_header_tio) {
                    name =
                        libredwg.dwg_entity_block_header_get_block(block_header_tio).name;
                }
            }
        }
        if (!name) {
            /* pre-R2.0 */
            name = libredwg.dwg_dynapi_entity_data(entity, 'block_name');
        }
        const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, 'ins_pt');
        const scale = libredwg.dwg_dynapi_entity_data(entity, 'scale');
        const rotation = libredwg.dwg_dynapi_entity_data(entity, 'rotation');
        const columnCount = libredwg.dwg_dynapi_entity_data(entity, 'num_cols');
        const rowCount = libredwg.dwg_dynapi_entity_data(entity, 'num_rows');
        const columnSpacing = libredwg.dwg_dynapi_entity_data(entity, 'col_spacing');
        const rowSpacing = libredwg.dwg_dynapi_entity_data(entity, 'row_spacing');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const attrib_ptr_array = libredwg.dwg_entity_insert_get_attribs(entity);
        const attribs = [];
        attrib_ptr_array.forEach(object_ptr => {
            const entity = libredwg.dwg_object_to_entity(object_ptr);
            const entity_tio = libredwg.dwg_object_to_entity_tio(object_ptr);
            if (entity && entity_tio) {
                // Get values of the common attributes of ATTRIB entity
                const commonAttrs = this.getCommonAttrs(entity);
                const fixedtype = libredwg.dwg_object_get_fixedtype(object_ptr);
                if (fixedtype == Dwg_Object_Type.DWG_TYPE_ATTRIB) {
                    attribs.push(this.convertAttrib(entity_tio, commonAttrs));
                }
            }
        });
        // TODO: convert block attributes
        return {
            type: 'INSERT',
            ...commonAttrs,
            name: name,
            insertionPoint: insertionPoint,
            xScale: scale ? scale.x : 1,
            yScale: scale ? scale.y : 1,
            zScale: scale ? scale.z : 1,
            rotation: rotation,
            columnCount: columnCount,
            rowCount: rowCount,
            columnSpacing: columnSpacing,
            rowSpacing: rowSpacing,
            extrusionDirection: extrusionDirection,
            attribs: attribs
        };
    }
    convertLeader(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const styleName = libredwg.dwg_entity_mtext_get_style_name(entity);
        const isArrowheadEnabled = libredwg.dwg_dynapi_entity_data(entity, 'arrowhead_type');
        const isSpline = libredwg.dwg_dynapi_entity_data(entity, 'path_type');
        const leaderCreationFlag = libredwg.dwg_dynapi_entity_data(entity, 'annot_type');
        const isHooklineSameDirection = libredwg.dwg_dynapi_entity_data(entity, 'hookline_dir');
        const isHooklineExists = libredwg.dwg_dynapi_entity_data(entity, 'hookline_on');
        const textHeight = libredwg.dwg_dynapi_entity_data(entity, 'box_height');
        const textWidth = libredwg.dwg_dynapi_entity_data(entity, 'box_width');
        const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, 'num_points');
        const vertices_ptr = libredwg.dwg_dynapi_entity_data(entity, 'points');
        const vertices = numberOfVertices > 0
            ? libredwg.dwg_ptr_to_point3d_array(vertices_ptr, numberOfVertices)
            : [];
        const byBlockColor = libredwg.dwg_dynapi_entity_data(entity, 'byblock_color');
        const normal = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const horizontalDirection = libredwg.dwg_dynapi_entity_data(entity, 'x_direction');
        const offsetFromBlock = libredwg.dwg_dynapi_entity_data(entity, 'inspt_offset');
        const offsetFromAnnotation = libredwg.dwg_dynapi_entity_data(entity, 'endptproj');
        return {
            type: 'LEADER',
            ...commonAttrs,
            styleName: styleName,
            isArrowheadEnabled: isArrowheadEnabled > 0,
            isSpline: isSpline > 0,
            leaderCreationFlag: leaderCreationFlag,
            isHooklineSameDirection: isHooklineSameDirection > 0,
            isHooklineExists: isHooklineExists > 0,
            textHeight: textHeight,
            textWidth: textWidth,
            numberOfVertices: numberOfVertices,
            vertices: vertices,
            byBlockColor: byBlockColor,
            normal: normal,
            horizontalDirection: horizontalDirection,
            offsetFromBlock: offsetFromBlock,
            offsetFromAnnotation: offsetFromAnnotation
        };
    }
    convertLine(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const startPoint = libredwg.dwg_dynapi_entity_data(entity, 'start');
        const endPoint = libredwg.dwg_dynapi_entity_data(entity, 'end');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        return {
            type: 'LINE',
            ...commonAttrs,
            thickness: thickness,
            startPoint: startPoint,
            endPoint: endPoint,
            extrusionDirection: extrusionDirection
        };
    }
    convertLWPolyline(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, 'num_points');
        const flag = libredwg.dwg_dynapi_entity_data(entity, 'flag');
        const constantWidth = libredwg.dwg_dynapi_entity_data(entity, 'const_width');
        const elevation = libredwg.dwg_dynapi_entity_data(entity, 'elevation');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const vertices = [];
        const num_points = libredwg.dwg_dynapi_entity_data(entity, 'num_points');
        const points_ptr = libredwg.dwg_dynapi_entity_data(entity, 'points');
        const points = libredwg.dwg_ptr_to_point2d_array(points_ptr, num_points);
        const num_bulges = libredwg.dwg_dynapi_entity_data(entity, 'num_bulges');
        const bulges_ptr = libredwg.dwg_dynapi_entity_data(entity, 'bulges');
        const bulges = libredwg.dwg_ptr_to_double_array(bulges_ptr, num_bulges);
        // Flag bit 32 = HAS_NUM_WIDTHS. Each Dwg_LWPOLYLINE_width is two BITCODE_BD
        // values (start, end). Without copying these, tapered polylines (e.g. valve
        // triangles) become zero-width lines after conversion.
        const num_widths = libredwg.dwg_dynapi_entity_data(entity, 'num_widths') ?? 0;
        const widths_ptr = libredwg.dwg_dynapi_entity_data(entity, 'widths');
        const widthDoubles = num_widths > 0 && widths_ptr
            ? libredwg.dwg_ptr_to_double_array(widths_ptr, num_widths * 2)
            : [];
        points.forEach((point, index) => {
            const vertex = {
                id: index,
                x: point.x,
                y: point.y,
                bulge: bulges.length > index ? bulges[index] : 0
            };
            if (index < num_widths && widthDoubles.length >= (index + 1) * 2) {
                vertex.startWidth = widthDoubles[index * 2];
                vertex.endWidth = widthDoubles[index * 2 + 1];
            }
            vertices.push(vertex);
        });
        return {
            type: 'LWPOLYLINE',
            ...commonAttrs,
            numberOfVertices: numberOfVertices,
            flag: flag,
            constantWidth: constantWidth,
            elevation: elevation,
            thickness: thickness,
            extrusionDirection: extrusionDirection,
            vertices: vertices
        };
    }
    convertMLine(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const scale = libredwg.dwg_dynapi_entity_data(entity, 'scale');
        const flags = libredwg.dwg_dynapi_entity_data(entity, 'flags');
        const justification = libredwg.dwg_dynapi_entity_data(entity, 'justification');
        const startPoint = libredwg.dwg_dynapi_entity_data(entity, 'base_point');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const numberOfLines = libredwg.dwg_dynapi_entity_data(entity, 'num_lines');
        const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, 'num_verts');
        const verts_ptr = libredwg.dwg_dynapi_entity_data(entity, 'verts');
        const verts = libredwg.dwg_ptr_to_mline_vertex_array(verts_ptr, numberOfVertices);
        const vertices = [];
        verts.forEach(vert => {
            vertices.push({
                vertex: vert.vertex,
                vertexDirection: vert.vertex_direction,
                miterDirection: vert.miter_direction,
                numberOfLines: vert.num_lines,
                lines: vert.lines.map(line => {
                    return {
                        numberOfSegmentParams: line.num_segparms,
                        segmentParams: line.segparms,
                        numberOfAreaFillParams: line.num_areafillparms,
                        areaFillParams: line.areafillparms
                    };
                })
            });
        });
        return {
            type: 'MLINE',
            ...commonAttrs,
            scale: scale,
            flags: flags,
            justification: justification,
            startPoint: startPoint,
            extrusionDirection: extrusionDirection,
            numberOfLines: numberOfLines,
            numberOfVertices: numberOfVertices,
            vertices: vertices,
            mlineStyle: '' // TODO: Set the correct value
        };
    }
    convertMultiLeader(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const entityVal = (field) => libredwg.dwg_dynapi_entity_data(entity, field);
        const subclassVal = (ptr, subclass, field) => libredwg.dwg_dynapi_subclass_data(ptr, subclass, field);
        const refToId = (ref) => libredwg.dwg_ref_get_id(ref);
        const asBool = (value) => value > 0;
        const mleaderColor = (color) => color != null ? dwgColorToMLeaderRawColor(color) : undefined;
        const version = entityVal('class_version');
        const leaderStyleId = refToId(entityVal('mleaderstyle'));
        const propertyOverrideFlag = entityVal('flags');
        const leaderLineType = entityVal('type');
        const leaderLineColor = mleaderColor(entityVal('line_color'));
        const leaderLineTypeId = refToId(entityVal('line_ltype'));
        const leaderLineWeight = entityVal('line_linewt');
        const landingEnabled = asBool(entityVal('has_landing'));
        const doglegEnabled = asBool(entityVal('has_dogleg'));
        const doglegLength = entityVal('landing_dist');
        const arrowheadId = refToId(entityVal('arrow_handle'));
        const arrowheadSize = entityVal('arrow_size');
        const contentType = entityVal('style_content');
        const textStyleId = refToId(entityVal('text_style'));
        const textLeftAttachmentType = entityVal('text_left');
        const textRightAttachmentType = entityVal('text_right');
        const textAngleType = entityVal('text_angletype');
        const textAlignmentType = entityVal('text_alignment');
        const textColor = mleaderColor(entityVal('text_color'));
        const textFrameEnabled = asBool(entityVal('has_text_frame'));
        const blockContentId = refToId(entityVal('block_style'));
        const blockContentColor = mleaderColor(entityVal('block_color'));
        const blockContentScale = entityVal('block_scale');
        const blockContentRotation = entityVal('block_rotation');
        const blockContentConnectionType = entityVal('style_attachment');
        const annotativeScaleEnabled = asBool(entityVal('is_annotative'));
        const textDirectionNegative = asBool(entityVal('is_neg_textdir'));
        const textAlignInIPE = entityVal('ipe_alignment');
        let textAttachmentPoint = entityVal('justification');
        const textAttachmentDirection = entityVal('attach_dir');
        const bottomTextAttachmentDirection = entityVal('attach_bottom');
        const topTextAttachmentDirection = entityVal('attach_top');
        const contentScale = entityVal('scale_factor');
        const numArrowheads = entityVal('num_arrowheads');
        const arrowheadsPtr = entityVal('arrowheads');
        const arrowHeadSize = libredwg.dwg_dynapi_subclass_size('LEADER_ArrowHead');
        const arrowheadOverrides = [];
        for (let i = 0; i < numArrowheads; i++) {
            const arrowheadPtr = arrowheadsPtr + i * arrowHeadSize;
            arrowheadOverrides.push({
                index: subclassVal(arrowheadPtr, 'LEADER_ArrowHead', 'is_default'),
                handle: refToId(subclassVal(arrowheadPtr, 'LEADER_ArrowHead', 'arrowhead')) ?? ''
            });
        }
        const numBlocklabels = entityVal('num_blocklabels');
        const blocklabelsPtr = entityVal('blocklabels');
        const blockLabelSize = libredwg.dwg_dynapi_subclass_size('LEADER_BlockLabel');
        const blockAttributes = [];
        for (let i = 0; i < numBlocklabels; i++) {
            const blocklabelPtr = blocklabelsPtr + i * blockLabelSize;
            blockAttributes.push({
                id: refToId(subclassVal(blocklabelPtr, 'LEADER_BlockLabel', 'attdef')),
                index: subclassVal(blocklabelPtr, 'LEADER_BlockLabel', 'ui_index'),
                width: subclassVal(blocklabelPtr, 'LEADER_BlockLabel', 'width'),
                text: subclassVal(blocklabelPtr, 'LEADER_BlockLabel', 'label_text')
            });
        }
        const ctxPtr = entity + libredwg.dwg_dynapi_entity_field_offset(entity, 'ctx');
        const contentPtr = ctxPtr +
            libredwg.dwg_dynapi_subclass_field_offset('MLEADER_AnnotContext', 'content');
        const contentScaleFactor = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'scale_factor');
        const contentBasePosition = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'content_base');
        const landingGap = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'landing_gap');
        const textAttachment = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'attach_dir');
        const contextTextHeight = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'text_height');
        const contextArrowSize = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'arrow_size');
        const contextTextLeft = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'text_left');
        const contextTextRight = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'text_right');
        const contextTextAngleType = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'text_angletype');
        const contextTextAlignment = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'text_alignment');
        const hasMText = asBool(subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'has_content_txt'));
        const hasBlock = asBool(subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'has_content_blk'));
        const planeOrigin = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'base');
        const planeXAxisDirection = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'base_dir');
        const planeYAxisDirection = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'base_vert');
        const planeNormalReversed = asBool(subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'is_normal_reversed'));
        let textFlowDirection;
        let normal;
        let textRotation;
        let textWidth;
        let textLineSpacingFactor;
        let textLineSpacingStyle;
        let textAnchor;
        let textDirection;
        let textBackgroundColor;
        let textBackgroundScaleFactor;
        let textBackgroundTransparency;
        let textBackgroundColorOn;
        let textFillOn;
        let textColumnType;
        let textUseAutoHeight;
        let textColumnWidth;
        let textColumnGutterWidth;
        let textColumnFlowReversed;
        let textColumnHeight;
        let textUseWordBreak;
        let textContent;
        if (hasMText) {
            const textAlignment = subclassVal(contentPtr, 'MLEADER_Content_MText', 'alignment');
            if (textAlignment != null && textAlignment !== 0) {
                textAttachmentPoint = textAlignment;
            }
            normal = subclassVal(contentPtr, 'MLEADER_Content_MText', 'normal');
            textAnchor = subclassVal(contentPtr, 'MLEADER_Content_MText', 'location');
            textRotation = subclassVal(contentPtr, 'MLEADER_Content_MText', 'rotation');
            textDirection = subclassVal(contentPtr, 'MLEADER_Content_MText', 'direction');
            textWidth = subclassVal(contentPtr, 'MLEADER_Content_MText', 'width');
            textLineSpacingFactor = subclassVal(contentPtr, 'MLEADER_Content_MText', 'line_spacing_factor');
            textLineSpacingStyle = subclassVal(contentPtr, 'MLEADER_Content_MText', 'line_spacing_style');
            textFlowDirection = subclassVal(contentPtr, 'MLEADER_Content_MText', 'flow');
            textBackgroundColor = mleaderColor(subclassVal(contentPtr, 'MLEADER_Content_MText', 'bg_color'));
            textBackgroundScaleFactor = subclassVal(contentPtr, 'MLEADER_Content_MText', 'bg_scale');
            textBackgroundTransparency = subclassVal(contentPtr, 'MLEADER_Content_MText', 'bg_transparency');
            textFillOn = asBool(subclassVal(contentPtr, 'MLEADER_Content_MText', 'is_bg_fill'));
            textBackgroundColorOn = asBool(subclassVal(contentPtr, 'MLEADER_Content_MText', 'is_bg_mask_fill'));
            textColumnType = subclassVal(contentPtr, 'MLEADER_Content_MText', 'col_type');
            textUseAutoHeight = asBool(subclassVal(contentPtr, 'MLEADER_Content_MText', 'is_height_auto'));
            textColumnWidth = subclassVal(contentPtr, 'MLEADER_Content_MText', 'col_width');
            textColumnGutterWidth = subclassVal(contentPtr, 'MLEADER_Content_MText', 'col_gutter');
            textColumnFlowReversed = asBool(subclassVal(contentPtr, 'MLEADER_Content_MText', 'is_col_flow_reversed'));
            const numColSizes = subclassVal(contentPtr, 'MLEADER_Content_MText', 'num_col_sizes');
            const colSizesPtr = subclassVal(contentPtr, 'MLEADER_Content_MText', 'col_sizes');
            if (numColSizes > 0) {
                textColumnHeight = libredwg.dwg_ptr_to_double_array(colSizesPtr, numColSizes)[0];
            }
            textUseWordBreak = asBool(subclassVal(contentPtr, 'MLEADER_Content_MText', 'word_break'));
            textContent = subclassVal(contentPtr, 'MLEADER_Content_MText', 'default_text');
        }
        let blockContent;
        if (hasBlock) {
            const transformPtr = subclassVal(contentPtr, 'MLEADER_Content_Block', 'transform');
            blockContent = {
                blockContentId: refToId(subclassVal(contentPtr, 'MLEADER_Content_Block', 'block_table')),
                normal: subclassVal(contentPtr, 'MLEADER_Content_Block', 'normal'),
                position: subclassVal(contentPtr, 'MLEADER_Content_Block', 'location'),
                scale: subclassVal(contentPtr, 'MLEADER_Content_Block', 'scale'),
                rotation: subclassVal(contentPtr, 'MLEADER_Content_Block', 'rotation'),
                color: mleaderColor(subclassVal(contentPtr, 'MLEADER_Content_Block', 'color')),
                transformationMatrix: transformPtr
                    ? libredwg.dwg_ptr_to_double_array(transformPtr, 16)
                    : undefined
            };
        }
        const numLeaders = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'num_leaders');
        const leadersPtr = subclassVal(ctxPtr, 'MLEADER_AnnotContext', 'leaders');
        const leaderNodeSize = libredwg.dwg_dynapi_subclass_size('LEADER_Node');
        const leaderLineSize = libredwg.dwg_dynapi_subclass_size('LEADER_Line');
        const leaderBreakSize = libredwg.dwg_dynapi_subclass_size('LEADER_Break');
        const leaderSections = [];
        for (let i = 0; i < numLeaders; i++) {
            const nodePtr = leadersPtr + i * leaderNodeSize;
            const lastLeaderLinePointSet = asBool(subclassVal(nodePtr, 'LEADER_Node', 'has_lastleaderlinepoint'));
            const doglegVectorSet = asBool(subclassVal(nodePtr, 'LEADER_Node', 'has_dogleg'));
            const numBreaks = subclassVal(nodePtr, 'LEADER_Node', 'num_breaks');
            const breaksPtr = subclassVal(nodePtr, 'LEADER_Node', 'breaks');
            const nodeBreaks = [];
            for (let j = 0; j < numBreaks; j++) {
                const breakPtr = breaksPtr + j * leaderBreakSize;
                nodeBreaks.push({
                    start: subclassVal(breakPtr, 'LEADER_Break', 'start'),
                    end: subclassVal(breakPtr, 'LEADER_Break', 'end')
                });
            }
            const numLines = subclassVal(nodePtr, 'LEADER_Node', 'num_lines');
            const linesPtr = subclassVal(nodePtr, 'LEADER_Node', 'lines');
            const leaderLines = [];
            for (let j = 0; j < numLines; j++) {
                const linePtr = linesPtr + j * leaderLineSize;
                const numPoints = subclassVal(linePtr, 'LEADER_Line', 'num_points');
                const pointsPtr = subclassVal(linePtr, 'LEADER_Line', 'points');
                const vertices = numPoints > 0
                    ? libredwg.dwg_ptr_to_point3d_array(pointsPtr, numPoints)
                    : [];
                const lineNumBreaks = subclassVal(linePtr, 'LEADER_Line', 'num_breaks');
                const lineBreaksPtr = subclassVal(linePtr, 'LEADER_Line', 'breaks');
                const lineBreaks = [];
                for (let k = 0; k < lineNumBreaks; k++) {
                    const breakPtr = lineBreaksPtr + k * leaderBreakSize;
                    lineBreaks.push({
                        start: subclassVal(breakPtr, 'LEADER_Break', 'start'),
                        end: subclassVal(breakPtr, 'LEADER_Break', 'end')
                    });
                }
                leaderLines.push({
                    vertices,
                    leaderLineIndex: subclassVal(linePtr, 'LEADER_Line', 'line_index'),
                    breaks: lineBreaks.length > 0 ? lineBreaks : undefined
                });
            }
            leaderSections.push({
                lastLeaderLinePoint: lastLeaderLinePointSet
                    ? subclassVal(nodePtr, 'LEADER_Node', 'lastleaderlinepoint')
                    : undefined,
                lastLeaderLinePointSet,
                doglegVector: doglegVectorSet
                    ? subclassVal(nodePtr, 'LEADER_Node', 'dogleg_vector')
                    : undefined,
                doglegVectorSet,
                doglegLength: subclassVal(nodePtr, 'LEADER_Node', 'dogleg_length'),
                breaks: nodeBreaks.length > 0 ? nodeBreaks : undefined,
                leaderBranchIndex: subclassVal(nodePtr, 'LEADER_Node', 'branch_index'),
                leaderLines
            });
        }
        return {
            type: 'MULTILEADER',
            ...commonAttrs,
            subclassMarker: 'AcDbMLeader',
            version,
            leaderStyleId,
            propertyOverrideFlag,
            leaderLineType,
            leaderLineColor,
            leaderLineTypeId,
            leaderLineWeight,
            landingEnabled,
            doglegEnabled,
            doglegLength,
            arrowheadId,
            arrowheadSize: arrowheadSize || contextArrowSize,
            contentType,
            textStyleId,
            textLeftAttachmentType: textLeftAttachmentType || contextTextLeft,
            textRightAttachmentType: textRightAttachmentType || contextTextRight,
            textAngleType: textAngleType || contextTextAngleType,
            textAlignmentType: textAlignmentType || contextTextAlignment,
            textColor,
            textFrameEnabled,
            landingGap,
            textAttachment,
            textFlowDirection,
            blockContentId,
            blockContentColor,
            blockContentScale,
            blockContentRotation,
            blockContentConnectionType,
            annotativeScaleEnabled,
            arrowheadOverrides: arrowheadOverrides.length > 0 ? arrowheadOverrides : undefined,
            blockAttributes: blockAttributes.length > 0 ? blockAttributes : undefined,
            textDirectionNegative,
            textAlignInIPE,
            textAttachmentPoint,
            textAttachmentDirection,
            bottomTextAttachmentDirection,
            topTextAttachmentDirection,
            contentScale: contentScale || contentScaleFactor,
            contentBasePosition,
            normal,
            textHeight: contextTextHeight,
            textRotation,
            textWidth,
            textLineSpacingFactor,
            textLineSpacingStyle,
            textAnchor,
            textDirection,
            textBackgroundColor,
            textBackgroundScaleFactor,
            textBackgroundTransparency,
            textBackgroundColorOn,
            textFillOn,
            textColumnType,
            textUseAutoHeight,
            textColumnWidth,
            textColumnGutterWidth,
            textColumnFlowReversed,
            textColumnHeight,
            textUseWordBreak,
            textContent,
            hasMText,
            hasBlock,
            blockContent,
            planeOrigin,
            planeXAxisDirection,
            planeYAxisDirection,
            planeNormalReversed,
            leaderSections: leaderSections.length > 0 ? leaderSections : undefined
        };
    }
    convertOle2Frame(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const oleVersion = libredwg.dwg_dynapi_entity_data(entity, 'oleversion');
        const oleClient = libredwg.dwg_dynapi_entity_data(entity, 'oleclient');
        const dataSize = libredwg.dwg_dynapi_entity_data(entity, 'data_size');
        let leftUpPoint = libredwg.dwg_dynapi_entity_data(entity, 'pt1');
        let rightDownPoint = libredwg.dwg_dynapi_entity_data(entity, 'pt2');
        const lockAspect = libredwg.dwg_dynapi_entity_data(entity, 'lock_aspect');
        const oleObjectType = libredwg.dwg_dynapi_entity_data(entity, 'type');
        const tileModeDescriptor = libredwg.dwg_dynapi_entity_data(entity, 'mode');
        // Prefer sized TF copy: dynapi TF truncates at the first embedded NUL.
        const dataBytes = libredwg.dwg_entity_ole2frame_get_data(entity);
        const binaryData = dataBytes ? uint8ArrayToHexString(dataBytes) : '';
        // Prefer corners decoded from the OLE header (also fixed in dwg_decode_ole2).
        if (dataBytes) {
            const corners = decodeOle2FrameCornersFromData(dataBytes);
            if (corners) {
                leftUpPoint = corners.upperLeft;
                rightDownPoint = corners.lowerRight;
            }
        }
        return {
            type: 'OLE2FRAME',
            ...commonAttrs,
            oleVersion: oleVersion,
            oleClient: oleClient,
            dataSize: dataSize,
            leftUpPoint: leftUpPoint,
            rightDownPoint: rightDownPoint,
            lockAspect: lockAspect,
            oleObjectType: oleObjectType,
            tileModeDescriptor: tileModeDescriptor,
            binaryData: binaryData
        };
    }
    convertOleFrame(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const flag = libredwg.dwg_dynapi_entity_data(entity, 'flag');
        const mode = libredwg.dwg_dynapi_entity_data(entity, 'mode');
        const dataSize = libredwg.dwg_dynapi_entity_data(entity, 'data_size');
        const dataBytes = libredwg.dwg_entity_oleframe_get_data(entity);
        const binaryData = dataBytes ? uint8ArrayToHexString(dataBytes) : '';
        return {
            type: 'OLEFRAME',
            ...commonAttrs,
            flag: flag,
            mode: mode,
            dataSize: dataSize,
            binaryData: binaryData
        };
    }
    convertMText(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, 'ins_pt');
        const textHeight = libredwg.dwg_dynapi_entity_data(entity, 'text_height');
        const rectHeight = libredwg.dwg_dynapi_entity_data(entity, 'rect_height');
        const rectWidth = libredwg.dwg_dynapi_entity_data(entity, 'rect_width');
        const extentsWidth = libredwg.dwg_dynapi_entity_data(entity, 'extents_width');
        const extentsHeight = libredwg.dwg_dynapi_entity_data(entity, 'extents_height');
        const attachmentPoint = libredwg.dwg_dynapi_entity_data(entity, 'attachment');
        const drawingDirection = libredwg.dwg_dynapi_entity_data(entity, 'flow_dir');
        const text = libredwg.dwg_dynapi_entity_data(entity, 'text');
        const styleName = libredwg.dwg_entity_mtext_get_style_name(entity);
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const direction = libredwg.dwg_dynapi_entity_data(entity, 'x_axis_dir');
        const lineSpacingStyle = libredwg.dwg_dynapi_entity_data(entity, 'linespace_style');
        const lineSpacing = libredwg.dwg_dynapi_entity_data(entity, 'linespace_factor');
        const backgroundFill = libredwg.dwg_dynapi_entity_data(entity, 'bg_fill_flag');
        const fillBoxScale = libredwg.dwg_dynapi_entity_data(entity, 'bg_fill_scale');
        const backgroundFillColor = libredwg.dwg_dynapi_entity_data(entity, 'bg_fill_color');
        const backgroundFillTransparency = libredwg.dwg_dynapi_entity_data(entity, 'bg_fill_trans');
        const columnType = libredwg.dwg_dynapi_entity_data(entity, 'column_type');
        const columnFlowReversed = libredwg.dwg_dynapi_entity_data(entity, 'flow_reversed');
        const columnAutoHeight = libredwg.dwg_dynapi_entity_data(entity, 'auto_height');
        const columnWidth = libredwg.dwg_dynapi_entity_data(entity, 'column_width');
        const columnGutter = libredwg.dwg_dynapi_entity_data(entity, 'gutter');
        const columnHeightCount = libredwg.dwg_dynapi_entity_data(entity, 'num_column_heights');
        const columnHeights_ptr = libredwg.dwg_dynapi_entity_data(entity, 'column_heights');
        const columnHeights = libredwg.dwg_ptr_to_double_array(columnHeights_ptr, columnHeightCount);
        return {
            type: 'MTEXT',
            ...commonAttrs,
            insertionPoint: insertionPoint,
            textHeight: textHeight,
            rectHeight: rectHeight,
            rectWidth: rectWidth,
            extentsHeight: extentsHeight,
            extentsWidth: extentsWidth,
            attachmentPoint: attachmentPoint,
            drawingDirection: drawingDirection,
            text: text,
            styleName: styleName,
            extrusionDirection: extrusionDirection,
            direction: direction,
            rotation: 0, // TODO: Didn't find the corresponding field in libredwg
            lineSpacingStyle: lineSpacingStyle,
            lineSpacing: lineSpacing,
            backgroundFill: backgroundFill,
            // backgroundColor: backgroundColor.rgb, // TODO: Double check whether it should be color index
            fillBoxScale: fillBoxScale,
            backgroundFillColor: backgroundFillColor.rgb, // TODO: Double check whether it should be color index
            backgroundFillTransparency: backgroundFillTransparency,
            columnType: columnType,
            // columnCount: columnCount,
            columnFlowReversed: columnFlowReversed,
            columnAutoHeight: columnAutoHeight,
            columnWidth: columnWidth,
            columnGutter: columnGutter,
            columnHeightCount: columnHeightCount,
            columnHeights: columnHeights
        };
    }
    convertPoint(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const x = libredwg.dwg_dynapi_entity_data(entity, 'x');
        const y = libredwg.dwg_dynapi_entity_data(entity, 'y');
        const z = libredwg.dwg_dynapi_entity_data(entity, 'z');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const angle = libredwg.dwg_dynapi_entity_data(entity, 'x_ang');
        return {
            type: 'POINT',
            ...commonAttrs,
            position: { x, y, z },
            thickness: thickness,
            extrusionDirection: extrusionDirection,
            angle: angle
        };
    }
    convertPolyline2d(entity, commonAttrs, object) {
        const libredwg = this.libredwg;
        const flag = libredwg.dwg_dynapi_entity_data(entity, 'flag');
        const smoothType = libredwg.dwg_dynapi_entity_data(entity, 'curve_type');
        const startWidth = libredwg.dwg_dynapi_entity_data(entity, 'start_width');
        const endWidth = libredwg.dwg_dynapi_entity_data(entity, 'end_width');
        const elevation = libredwg.dwg_dynapi_entity_data(entity, 'elevation');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const vertices = libredwg.dwg_entity_polyline_2d_get_vertices(object) ?? [];
        return {
            type: 'POLYLINE2D',
            ...commonAttrs,
            flag: flag,
            smoothType: smoothType,
            startWidth: startWidth,
            endWidth: endWidth,
            elevation: elevation,
            thickness: thickness,
            extrusionDirection: extrusionDirection,
            vertices: vertices.map(vertex => {
                return {
                    x: vertex.point.x,
                    y: vertex.point.y,
                    z: vertex.point.z,
                    startWidth: vertex.start_width,
                    endWidth: vertex.end_width,
                    bulge: vertex.bulge,
                    flag: vertex.flag,
                    tangentDirection: vertex.tangent_dir
                };
            }),
            meshMVertexCount: 0,
            meshNVertexCount: 0,
            surfaceMDensity: 0,
            surfaceNDensity: 0
        };
    }
    convertPolyline3d(entity, commonAttrs, object) {
        const libredwg = this.libredwg;
        const flag = libredwg.dwg_dynapi_entity_data(entity, 'flag');
        const smoothType = libredwg.dwg_dynapi_entity_data(entity, 'curve_type');
        const startWidth = libredwg.dwg_dynapi_entity_data(entity, 'start_width');
        const endWidth = libredwg.dwg_dynapi_entity_data(entity, 'end_width');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const vertices = libredwg.dwg_entity_polyline_3d_get_vertices(object) ?? [];
        return {
            type: 'POLYLINE3D',
            ...commonAttrs,
            flag: flag,
            smoothType: smoothType,
            startWidth: startWidth,
            endWidth: endWidth,
            extrusionDirection: extrusionDirection,
            vertices: vertices.map(vertex => {
                return {
                    x: vertex.point.x,
                    y: vertex.point.y,
                    z: vertex.point.z,
                    flag: vertex.flag
                };
            })
        };
    }
    convertProxyEntity(entity, commonAttrs, objectPtr) {
        const libredwg = this.libredwg;
        const proxyEntityClassId = libredwg.dwg_dynapi_entity_data(entity, 'proxy_id');
        const applicationEntityClassId = libredwg.dwg_dynapi_entity_data(entity, 'class_id');
        const entityDataSize = libredwg.dwg_dynapi_entity_data(entity, 'data_numbits');
        const objectDrawingFormat = libredwg.dwg_dynapi_entity_data(entity, 'version');
        const fromDxf = libredwg.dwg_dynapi_entity_data(entity, 'from_dxf');
        const numObjIds = libredwg.dwg_dynapi_entity_data(entity, 'num_objids');
        const graphicsBytes = libredwg.dwg_entity_get_preview(objectPtr);
        const graphicsDataSize = graphicsBytes?.length ?? 0;
        const entityBytes = libredwg.dwg_entity_proxy_entity_get_entity_data(entity);
        const graphicsData = graphicsBytes
            ? uint8ArrayToHexString(graphicsBytes)
            : undefined;
        const entityData = entityBytes
            ? uint8ArrayToHexString(entityBytes)
            : undefined;
        let linkedObjectIds;
        if (numObjIds > 0) {
            const objidsPtr = libredwg.dwg_dynapi_entity_data(entity, 'objids');
            if (objidsPtr) {
                const objids = libredwg.dwg_ptr_to_object_ref_array(objidsPtr, numObjIds);
                linkedObjectIds = objids.map(ref => idToString(ref.absolute_ref));
            }
        }
        const originalDxfName = this.getOriginalDxfName(applicationEntityClassId);
        const result = {
            type: 'ACAD_PROXY_ENTITY',
            subclassMarker: 'AcDbProxyEntity',
            ...commonAttrs,
            proxyEntityClassId: proxyEntityClassId || 498,
            applicationEntityClassId
        };
        if (originalDxfName) {
            result.originalDxfName = originalDxfName;
        }
        if (graphicsDataSize > 0) {
            result.graphicsDataSize = graphicsDataSize;
        }
        if (graphicsData) {
            result.graphicsData = graphicsData;
        }
        if (entityDataSize > 0) {
            result.entityDataSize = entityDataSize;
        }
        if (entityData) {
            result.entityData = entityData;
        }
        if (linkedObjectIds && linkedObjectIds.length > 0) {
            result.linkedObjectIds = linkedObjectIds;
        }
        if (objectDrawingFormat) {
            result.objectDrawingFormat = objectDrawingFormat;
        }
        if (fromDxf === 0 || fromDxf === 1) {
            result.originalDataFormat =
                fromDxf;
        }
        return result;
    }
    getOriginalDxfName(classId) {
        if (this.classes.length === 0 || classId < 0) {
            return undefined;
        }
        const index = classId >= 500 ? classId - 500 : classId;
        if (index >= 0 && index < this.classes.length) {
            return this.classes[index].dxfName;
        }
        return undefined;
    }
    convertRay(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const firstPoint = libredwg.dwg_dynapi_entity_data(entity, 'point');
        const unitDirection = libredwg.dwg_dynapi_entity_data(entity, 'vector');
        return {
            type: 'RAY',
            ...commonAttrs,
            firstPoint: firstPoint,
            unitDirection: unitDirection
        };
    }
    convertSection(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const state = libredwg.dwg_dynapi_entity_data(entity, 'state');
        const flags = libredwg.dwg_dynapi_entity_data(entity, 'flag');
        const name = libredwg.dwg_dynapi_entity_data(entity, 'name');
        const verticalDirection = libredwg.dwg_dynapi_entity_data(entity, 'vert_dir');
        const topHeight = libredwg.dwg_dynapi_entity_data(entity, 'top_height');
        const bottomHeight = libredwg.dwg_dynapi_entity_data(entity, 'bottom_height');
        const indicatorTransparency = libredwg.dwg_dynapi_entity_data(entity, 'indicator_alpha');
        const indicatorColor = libredwg.dwg_dynapi_entity_data(entity, 'indicator_color');
        const numberOfVertices = libredwg.dwg_dynapi_entity_data(entity, 'num_verts');
        const vertices_ptr = libredwg.dwg_dynapi_entity_data(entity, 'verts');
        const vertices = numberOfVertices > 0
            ? libredwg.dwg_ptr_to_point3d_array(vertices_ptr, numberOfVertices)
            : [];
        const numberOfBackLineVertices = libredwg.dwg_dynapi_entity_data(entity, 'num_blverts');
        const backLineVertices_ptr = libredwg.dwg_dynapi_entity_data(entity, 'blverts');
        const backLineVertices = numberOfBackLineVertices > 0
            ? libredwg.dwg_ptr_to_point3d_array(backLineVertices_ptr, numberOfBackLineVertices)
            : [];
        const geometrySettingHandle = libredwg.dwg_dynapi_entity_data(entity, 'geometrySettingHardId');
        const geometrySettingHardId = libredwg.dwg_ref_get_handle_absolute_ref(geometrySettingHandle) ?? 0n;
        return {
            type: 'SECTION',
            ...commonAttrs,
            state: state,
            flags: flags,
            name: name,
            verticalDirection: verticalDirection,
            topHeight: topHeight,
            bottomHeight: bottomHeight,
            indicatorTransparency: indicatorTransparency,
            indicatorColor: indicatorColor.rgb,
            numberOfVertices: numberOfVertices,
            vertices: vertices,
            numberOfBackLineVertices: numberOfBackLineVertices,
            backLineVertices: backLineVertices,
            geometrySettingHardId: geometrySettingHardId
        };
    }
    convertShape(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, 'ins_pt');
        const size = libredwg.dwg_dynapi_entity_data(entity, 'scale');
        const rotation = libredwg.dwg_dynapi_entity_data(entity, 'rotation');
        const xScale = libredwg.dwg_dynapi_entity_data(entity, 'width_factor');
        const obliqueAngle = libredwg.dwg_dynapi_entity_data(entity, 'oblique_angle');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const shapeNumber = libredwg.dwg_dynapi_entity_data(entity, 'style_id');
        const styleName = libredwg.dwg_entity_text_get_style_name(entity);
        return {
            type: 'SHAPE',
            subclassMarker: 'AcDbShape',
            ...commonAttrs,
            thickness: thickness,
            insertionPoint: insertionPoint,
            size: size,
            shapeNumber: shapeNumber,
            styleName: styleName,
            rotation: rotation,
            xScale: xScale,
            obliqueAngle: obliqueAngle,
            extrusionDirection: extrusionDirection
        };
    }
    convertSolid(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const corner1 = libredwg.dwg_dynapi_entity_data(entity, 'corner1');
        const corner2 = libredwg.dwg_dynapi_entity_data(entity, 'corner2');
        const corner3 = libredwg.dwg_dynapi_entity_data(entity, 'corner3');
        const corner4 = libredwg.dwg_dynapi_entity_data(entity, 'corner4');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        return {
            type: 'SOLID',
            ...commonAttrs,
            corner1: corner1,
            corner2: corner2,
            corner3: corner3,
            corner4: corner4,
            thickness: thickness,
            extrusionDirection: extrusionDirection
        };
    }
    convertTrace(entity, commonAttrs) {
        const solid = this.convertSolid(entity, commonAttrs);
        return {
            ...solid,
            type: 'TRACE'
        };
    }
    convertSpline(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const flag = libredwg.dwg_dynapi_entity_data(entity, 'splineflags');
        const degree = libredwg.dwg_dynapi_entity_data(entity, 'degree');
        // Convert knots
        const knotTolerance = libredwg.dwg_dynapi_entity_data(entity, 'knot_tol');
        const numberOfKnots = libredwg.dwg_dynapi_entity_data(entity, 'num_knots');
        const knots_ptr = libredwg.dwg_dynapi_entity_data(entity, 'knots');
        const knots = libredwg.dwg_ptr_to_double_array(knots_ptr, numberOfKnots);
        // Convert fit points
        const fitTolerance = libredwg.dwg_dynapi_entity_data(entity, 'fit_tol');
        const numberOfFitPoints = libredwg.dwg_dynapi_entity_data(entity, 'num_fit_pts');
        const fit_pts_ptr = libredwg.dwg_dynapi_entity_data(entity, 'fit_pts');
        const fitPoints = libredwg.dwg_ptr_to_point3d_array(fit_pts_ptr, numberOfFitPoints);
        // Convert control points
        const weighted = libredwg.dwg_dynapi_entity_data(entity, 'weighted');
        const controlTolerance = libredwg.dwg_dynapi_entity_data(entity, 'ctrl_tol');
        const numberOfControlPoints = libredwg.dwg_dynapi_entity_data(entity, 'num_ctrl_pts');
        const ctrl_pts_ptr = libredwg.dwg_dynapi_entity_data(entity, 'ctrl_pts');
        const controlPoints = libredwg.dwg_ptr_to_point4d_array(ctrl_pts_ptr, numberOfControlPoints);
        const startTangent = libredwg.dwg_dynapi_entity_data(entity, 'beg_tan_vec');
        const endTangent = libredwg.dwg_dynapi_entity_data(entity, 'end_tan_vec');
        return {
            type: 'SPLINE',
            ...commonAttrs,
            // normal?: DwgPoint3D
            flag: flag,
            degree: degree,
            numberOfKnots: numberOfKnots,
            numberOfControlPoints: numberOfControlPoints,
            numberOfFitPoints: numberOfFitPoints,
            knotTolerance: knotTolerance,
            controlTolerance: controlTolerance,
            fitTolerance: fitTolerance,
            startTangent: startTangent,
            endTangent: endTangent,
            knots: knots,
            weights: weighted ? controlPoints.map(value => value.w) : undefined,
            controlPoints: controlPoints.map(value => {
                return {
                    x: value.x,
                    y: value.y,
                    z: value.z
                };
            }),
            fitPoints: fitPoints
        };
    }
    convertTable(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const name = libredwg.dwg_dynapi_subclass_data(entity, 'ldata', 'name');
        const startPoint = libredwg.dwg_dynapi_entity_data(entity, 'ins_pt');
        const directionVector = libredwg.dwg_dynapi_entity_data(entity, 'horiz_direction');
        const tableValue = libredwg.dwg_dynapi_entity_data(entity, 'flag_for_table_value');
        const rowCount = libredwg.dwg_dynapi_entity_data(entity, 'num_rows');
        const columnCount = libredwg.dwg_dynapi_entity_data(entity, 'num_cols');
        const row_heights_ptr = libredwg.dwg_dynapi_entity_data(entity, 'row_heights');
        const rowHeightArr = libredwg.dwg_ptr_to_double_array(row_heights_ptr, rowCount);
        const col_widths_ptr = libredwg.dwg_dynapi_entity_data(entity, 'col_widths');
        const columnWidthArr = libredwg.dwg_ptr_to_double_array(col_widths_ptr, columnCount);
        const table_style_ref = libredwg.dwg_dynapi_entity_data(entity, 'tablestyle');
        const tableStyleId = libredwg.dwg_ref_get_id(table_style_ref) ?? '';
        const block_header_ref = libredwg.dwg_dynapi_entity_data(entity, 'block_header');
        const blockRecordHandle = libredwg.dwg_ref_get_id(block_header_ref) ?? '';
        const overrideFlag = libredwg.dwg_dynapi_entity_data(entity, 'table_flag_override');
        const borderColorOverrideFlag = libredwg.dwg_dynapi_entity_data(entity, 'border_color_overrides_flag');
        const borderLineWeightOverrideFlag = libredwg.dwg_dynapi_entity_data(entity, 'border_lineweight_overrides_flag');
        const borderVisibilityOverrideFlag = libredwg.dwg_dynapi_entity_data(entity, 'border_visibility_overrides_flag');
        const num_cells = libredwg.dwg_dynapi_entity_data(entity, 'num_cells');
        const cells_ptr = libredwg.dwg_dynapi_entity_data(entity, 'cells');
        const cells = libredwg.dwg_ptr_to_table_cell_array(cells_ptr, num_cells);
        return {
            type: 'ACAD_TABLE',
            ...commonAttrs,
            name: name,
            startPoint: startPoint,
            directionVector: directionVector,
            // attachmentPoint: DwgAttachmentPoint
            tableValue: tableValue,
            rowCount: rowCount,
            columnCount: columnCount,
            overrideFlag: overrideFlag,
            borderColorOverrideFlag: borderColorOverrideFlag,
            borderLineWeightOverrideFlag: borderLineWeightOverrideFlag,
            borderVisibilityOverrideFlag: borderVisibilityOverrideFlag,
            rowHeightArr: rowHeightArr,
            columnWidthArr: columnWidthArr,
            tableStyleId: tableStyleId,
            blockRecordHandle: blockRecordHandle,
            cells: this.convertTableCells(cells),
            bmpPreview: ''
        };
    }
    convertTableCells(cells) {
        return cells.map(cell => ({
            text: cell.text_value,
            attachmentPoint: cell.cell_alignment,
            textStyle: cell.text_style
                ? String(cell.text_style)
                : undefined,
            rotation: cell.rotation,
            cellType: cell.type,
            flagValue: cell.flags,
            mergedValue: cell.is_merged_value,
            autoFit: cell.is_autofit_flag,
            topBorderVisibility: !!cell.top_visibility,
            bottomBorderVisibility: !!cell.bottom_visibility,
            leftBorderVisibility: !!cell.left_visibility,
            rightBorderVisibility: !!cell.right_visibility,
            overrideFlag: cell.cell_flag_override,
            virtualEdgeFlag: cell.virtual_edge_flag,
            blockTableRecordId: cell.block_handle
                ? String(cell.block_handle.absolute_ref ?? '')
                : undefined,
            blockScale: cell.block_scale,
            blockAttrNum: cell.attr_defs?.length ?? 0,
            attrDefineId: cell.attr_defs?.map(value => String(value.attdef?.absolute_ref ?? '')),
            textHeight: cell.text_height ?? 0,
            extendedCellFlags: cell.additional_data_flag
        }));
    }
    convertTextBase(entity) {
        const libredwg = this.libredwg;
        const text = libredwg.dwg_dynapi_entity_data(entity, 'text_value');
        const thickness = libredwg.dwg_dynapi_entity_data(entity, 'thickness');
        const startPoint = libredwg.dwg_dynapi_entity_data(entity, 'ins_pt');
        const endPoint = libredwg.dwg_dynapi_entity_data(entity, 'alignment_pt');
        const rotation = libredwg.dwg_dynapi_entity_data(entity, 'rotation');
        const textHeight = libredwg.dwg_dynapi_entity_data(entity, 'height');
        const xScale = libredwg.dwg_dynapi_entity_data(entity, 'width_factor');
        const obliqueAngle = libredwg.dwg_dynapi_entity_data(entity, 'oblique_angle');
        const styleName = libredwg.dwg_entity_text_get_style_name(entity);
        const generationFlag = libredwg.dwg_dynapi_entity_data(entity, 'generation');
        const halign = libredwg.dwg_dynapi_entity_data(entity, 'horiz_alignment');
        const valign = libredwg.dwg_dynapi_entity_data(entity, 'vert_alignment');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        return {
            text: text,
            thickness: thickness,
            startPoint: startPoint,
            endPoint: endPoint,
            textHeight: textHeight,
            rotation: rotation,
            xScale: xScale,
            obliqueAngle: obliqueAngle,
            styleName: styleName,
            generationFlag: generationFlag,
            halign: halign,
            valign: valign,
            extrusionDirection: extrusionDirection
        };
    }
    convertText(entity, commonAttrs) {
        return {
            type: 'TEXT',
            ...commonAttrs,
            ...this.convertTextBase(entity)
        };
    }
    convertTolerance(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const insertionPoint = libredwg.dwg_dynapi_entity_data(entity, 'ins_pt');
        const text = libredwg.dwg_dynapi_entity_data(entity, 'text_value');
        const xAxisDirection = libredwg.dwg_dynapi_entity_data(entity, 'x_direction');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const dimStyleName = libredwg.dwg_entity_get_dimstyle_name(entity);
        return {
            type: 'TOLERANCE',
            ...commonAttrs,
            styleName: dimStyleName,
            insertionPoint: insertionPoint,
            text: text,
            extrusionDirection: extrusionDirection,
            xAxisDirection: xAxisDirection
        };
    }
    convertViewport(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const viewportCenter = libredwg.dwg_dynapi_entity_data(entity, 'center');
        const width = libredwg.dwg_dynapi_entity_data(entity, 'width');
        const height = libredwg.dwg_dynapi_entity_data(entity, 'height');
        const status = libredwg.dwg_dynapi_entity_data(entity, 'on_off');
        const displayCenter = libredwg.dwg_dynapi_entity_data(entity, 'VIEWCTR');
        const snapBase = libredwg.dwg_dynapi_entity_data(entity, 'SNAPBASE');
        const snapSpacing = libredwg.dwg_dynapi_entity_data(entity, 'SNAPUNIT');
        const gridSpacing = libredwg.dwg_dynapi_entity_data(entity, 'GRIDUNIT');
        const viewDirection = libredwg.dwg_dynapi_entity_data(entity, 'VIEWDIR');
        const targetPoint = libredwg.dwg_dynapi_entity_data(entity, 'view_target');
        const perspectiveLensLength = libredwg.dwg_dynapi_entity_data(entity, 'lens_length');
        const frontClipZ = libredwg.dwg_dynapi_entity_data(entity, 'front_clip_z');
        const backClipZ = libredwg.dwg_dynapi_entity_data(entity, 'back_clip_z');
        // TODO: I am not sure whether view size in libredwg represents view height
        const viewHeight = libredwg.dwg_dynapi_entity_data(entity, 'VIEWSIZE');
        const snapAngle = libredwg.dwg_dynapi_entity_data(entity, 'SNAPANG');
        const viewTwistAngle = libredwg.dwg_dynapi_entity_data(entity, 'twist_angle');
        const circleZoomPercent = libredwg.dwg_dynapi_entity_data(entity, 'circle_zoom');
        // TODO: convert frozenLayerIds and clippingBoundaryId
        const statusBitFlags = libredwg.dwg_dynapi_entity_data(entity, 'status_flag');
        const sheetName = libredwg.dwg_dynapi_entity_data(entity, 'style_sheet');
        const renderMode = libredwg.dwg_dynapi_entity_data(entity, 'render_mode');
        // TODO: Not sure whether UCSVP in libredwg represents ucsPerViewport
        const ucsPerViewport = libredwg.dwg_dynapi_entity_data(entity, 'UCSVP');
        const ucsOrigin = libredwg.dwg_dynapi_entity_data(entity, 'ucsorg');
        const ucsXAxis = libredwg.dwg_dynapi_entity_data(entity, 'ucsxdir');
        const ucsYAxis = libredwg.dwg_dynapi_entity_data(entity, 'ucsydir');
        const named_ucs_ref = libredwg.dwg_dynapi_entity_data(entity, 'named_ucs');
        const ucsId = libredwg.dwg_ref_get_id(named_ucs_ref);
        const base_ucs_ref = libredwg.dwg_dynapi_entity_data(entity, 'base_ucs');
        const ucsBaseId = libredwg.dwg_ref_get_id(base_ucs_ref);
        // TODO: Not sure whether UCSORTHOVIEW represents orthographicType
        const orthographicType = libredwg.dwg_dynapi_entity_data(entity, 'UCSORTHOVIEW');
        const elevation = libredwg.dwg_dynapi_entity_data(entity, 'ucs_elevation');
        const shadePlotMode = libredwg.dwg_dynapi_entity_data(entity, 'shadeplot_mode');
        const isDefaultLighting = libredwg.dwg_dynapi_entity_data(entity, 'use_default_lights');
        const defaultLightingType = libredwg.dwg_dynapi_entity_data(entity, 'default_lighting_type');
        const brightness = libredwg.dwg_dynapi_entity_data(entity, 'brightness');
        const contrast = libredwg.dwg_dynapi_entity_data(entity, 'contrast');
        const majorGridFrequency = libredwg.dwg_dynapi_entity_data(entity, 'grid_major');
        const background_ref = libredwg.dwg_dynapi_entity_data(entity, 'background');
        const backgroundId = libredwg.dwg_ref_get_id(background_ref);
        const shadeplot_ref = libredwg.dwg_dynapi_entity_data(entity, 'shadeplot');
        const shadePlotId = libredwg.dwg_ref_get_id(shadeplot_ref);
        const visualstyle_ref = libredwg.dwg_dynapi_entity_data(entity, 'visualstyle');
        const visualStyleId = libredwg.dwg_ref_get_id(visualstyle_ref);
        // TODO: convert ambientLightColor
        const sun_ref = libredwg.dwg_dynapi_entity_data(entity, 'sun');
        const sunId = libredwg.dwg_ref_get_id(sun_ref);
        return {
            type: 'VIEWPORT',
            ...commonAttrs,
            viewportCenter: viewportCenter,
            width: width,
            height: height,
            status: status,
            viewportId: 0, // Will be set later in LibreDwgConverter.convert
            displayCenter: displayCenter,
            snapBase: snapBase,
            snapSpacing: snapSpacing,
            gridSpacing: gridSpacing,
            viewDirection: viewDirection,
            targetPoint: targetPoint,
            perspectiveLensLength: perspectiveLensLength,
            frontClipZ: frontClipZ,
            backClipZ: backClipZ,
            viewHeight: viewHeight,
            snapAngle: snapAngle,
            viewTwistAngle: viewTwistAngle,
            circleZoomPercent: circleZoomPercent,
            statusBitFlags: statusBitFlags,
            sheetName: sheetName,
            renderMode: renderMode,
            ucsPerViewport: ucsPerViewport,
            ucsOrigin: ucsOrigin,
            ucsXAxis: ucsXAxis,
            ucsYAxis: ucsYAxis,
            ucsId: ucsId ?? '',
            ucsBaseId: ucsBaseId ?? '',
            orthographicType: orthographicType,
            elevation: elevation,
            shadePlotMode: shadePlotMode,
            majorGridFrequency: majorGridFrequency,
            backgroundId: backgroundId ?? '',
            shadePlotId: shadePlotId ?? '',
            visualStyleId: visualStyleId ?? '',
            isDefaultLighting: !!isDefaultLighting,
            defaultLightingType: defaultLightingType,
            brightness: brightness,
            contrast: contrast,
            sunId: sunId ?? ''
        };
    }
    convertWipeout(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const version = libredwg.dwg_dynapi_entity_data(entity, 'class_version');
        const position = libredwg.dwg_dynapi_entity_data(entity, 'pt0');
        const uPixel = libredwg.dwg_dynapi_entity_data(entity, 'uvec');
        const vPixel = libredwg.dwg_dynapi_entity_data(entity, 'vvec');
        const imageSize = libredwg.dwg_dynapi_entity_data(entity, 'image_size');
        const flags = libredwg.dwg_dynapi_entity_data(entity, 'display_props');
        const clipping = libredwg.dwg_dynapi_entity_data(entity, 'clipping');
        const brightness = libredwg.dwg_dynapi_entity_data(entity, 'brightness');
        const contrast = libredwg.dwg_dynapi_entity_data(entity, 'contrast');
        const fade = libredwg.dwg_dynapi_entity_data(entity, 'fade');
        const clipMode = libredwg.dwg_dynapi_entity_data(entity, 'clip_mode');
        const clippingBoundaryType = libredwg.dwg_dynapi_entity_data(entity, 'clip_boundary_type');
        const countBoundaryPoints = libredwg.dwg_dynapi_entity_data(entity, 'num_clip_verts');
        const clip_verts = libredwg.dwg_dynapi_entity_data(entity, 'clip_verts');
        const clippingBoundaryPath = libredwg.dwg_ptr_to_point2d_array(clip_verts, countBoundaryPoints);
        const imagedef_ref = libredwg.dwg_dynapi_entity_data(entity, 'imagedef');
        const imageDefHandle = libredwg.dwg_ref_get_absref(imagedef_ref) ?? 0;
        const imagedefreactor_ref = libredwg.dwg_dynapi_entity_data(entity, 'imagedefreactor');
        const imageDefReactorHandle = libredwg.dwg_ref_get_absref(imagedefreactor_ref) ?? 0;
        return {
            type: 'WIPEOUT',
            ...commonAttrs,
            version: version,
            position: position,
            uPixel: uPixel,
            vPixel: vPixel,
            imageSize: imageSize,
            imageDefHandle: imageDefHandle,
            flags: flags,
            clipping: clipping,
            brightness: brightness,
            contrast: contrast,
            fade: fade,
            imageDefReactorHandle: imageDefReactorHandle,
            clippingBoundaryType: clippingBoundaryType,
            countBoundaryPoints: countBoundaryPoints,
            clippingBoundaryPath: clippingBoundaryPath,
            clipMode: clipMode
        };
    }
    convertXline(entity, commonAttrs) {
        const libredwg = this.libredwg;
        const firstPoint = libredwg.dwg_dynapi_entity_data(entity, 'point');
        const unitDirection = libredwg.dwg_dynapi_entity_data(entity, 'vector');
        return {
            type: 'XLINE',
            ...commonAttrs,
            firstPoint: firstPoint,
            unitDirection: unitDirection
        };
    }
    getDimensionCommonAttrs(entity) {
        const libredwg = this.libredwg;
        const version = libredwg.dwg_dynapi_entity_data(entity, 'class_version');
        const name = libredwg.dwg_entity_get_block_name(entity, 'block');
        const definitionPoint = libredwg.dwg_dynapi_entity_data(entity, 'def_pt');
        const textPoint = libredwg.dwg_dynapi_entity_data(entity, 'text_midpt');
        const attachmentPoint = libredwg.dwg_dynapi_entity_data(entity, 'attachmentPoint');
        const dimensionType = libredwg.dwg_dynapi_entity_data(entity, 'flag');
        const textLineSpacingStyle = libredwg.dwg_dynapi_entity_data(entity, 'lspace_factor');
        const textLineSpacingFactor = libredwg.dwg_dynapi_entity_data(entity, 'lspace_factor');
        const measurement = libredwg.dwg_dynapi_entity_data(entity, 'act_measurement');
        const text = libredwg.dwg_dynapi_entity_data(entity, 'user_text');
        const textRotation = libredwg.dwg_dynapi_entity_data(entity, 'text_rotation');
        // TODO: Not sure whether 'ins_rotation' is 'ocsRotation'.
        const ocsRotation = libredwg.dwg_dynapi_entity_data(entity, 'ins_rotation');
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(entity, 'extrusion');
        const styleName = libredwg.dwg_entity_get_dimstyle_name(entity);
        return {
            type: 'DIMENSION',
            version: version,
            name: name,
            definitionPoint: definitionPoint,
            textPoint: textPoint,
            dimensionType: dimensionType,
            attachmentPoint: attachmentPoint,
            textLineSpacingStyle: textLineSpacingStyle,
            textLineSpacingFactor: textLineSpacingFactor || 1,
            measurement: measurement,
            text: text,
            textRotation: textRotation,
            ocsRotation: ocsRotation,
            extrusionDirection: extrusionDirection,
            styleName: styleName
        };
    }
    getCommonAttrs(entity) {
        const libredwg = this.libredwg;
        const color = libredwg.dwg_object_entity_get_color_object(entity);
        // - 0xc0 for ByLayer (also c3 and rgb of 0x100)
        // - 0xc1 for ByBlock (also c3 and rgb of 0)
        // - 0xc2 for entities (default), with names with an additional name flag RC
        // - 0xc3 for truecolor
        // - 0xc5 for foreground color
        // - 0xc8 for none (also c3 and rgb of 0x101)
        const method = color.method;
        const colorIndex = color.index;
        let rgbColor = undefined;
        if (method == 0xc2 || ((color.rgb >>> 24) & 0xff) === 0xc2) {
            rgbColor = color.rgb & 0x00ffffff;
        }
        const layer = this.getLayerName(entity);
        const handle = libredwg.dwg_object_entity_get_handle_object(entity);
        const ownerhandle = libredwg.dwg_object_entity_get_ownerhandle_object(entity);
        const ownerDictionaryHardId = libredwg.dwg_object_entity_get_xdicobjhandle_object(entity);
        const lineType = this.getLtypeName(entity);
        const lineweight = libredwg.dwg_object_entity_get_line_weight(entity);
        const lineTypeScale = libredwg.dwg_object_entity_get_ltype_scale(entity);
        const isVisible = !libredwg.dwg_object_entity_get_invisible(entity);
        const xdata = libredwg.dwg_object_entity_get_xdata(entity);
        return {
            handle: idToString(handle.value),
            ownerDictionaryHardId: idToString(ownerDictionaryHardId.absolute_ref),
            ownerBlockRecordSoftId: idToString(ownerhandle.absolute_ref),
            layer: layer,
            color: rgbColor,
            colorIndex: colorIndex,
            colorName: color.name,
            lineType: lineType,
            lineweight: lineweight,
            lineTypeScale: lineTypeScale,
            isVisible: isVisible,
            transparency: color.alpha,
            transparencyType: color.alpha_type,
            xdata: xdata
        };
    }
    getLayerName(entity) {
        const libredwg = this.libredwg;
        const layer = libredwg.dwg_object_entity_get_layer_object_ref(entity);
        const name = this.layers.get(idToString(layer.absolute_ref || layer.handleref.value));
        return name ?? '0';
    }
    getLtypeName(entity) {
        const libredwg = this.libredwg;
        const ltype = libredwg.dwg_object_entity_get_ltype_object_ref(entity);
        const name = this.ltypes.get(idToString(ltype.absolute_ref || ltype.handleref.value));
        return name ?? '';
    }
}
//# sourceMappingURL=entityConverter.js.map