import { HEADER_VARIABLES } from '../database';
import { Dwg_Object_Supertype, Dwg_Object_Type } from '../types';
import { dwgColorToMLeaderRawColor } from './dwgColorToMLeaderRawColor';
import { LibreEntityConverter } from './entityConverter';
import { idToString, isModelSpace, isPaperSpace, uint8ArrayToHexString } from './utils';
/**
 * Class used to convert Dwg_Data instance to DwgDatabase instance.
 */
export class LibreDwgConverter {
    libredwg;
    entityConverter;
    /**
     * Entity object indices keyed by owning BLOCK_HEADER object pointer.
     * Built lazily when an ownership walk returns no entities (LibreDWG
     * https://github.com/LibreDWG/libredwg/issues/1199).
     */
    orphanEntitiesByBlock = null;
    /** Entity indices whose ownerhandle does not resolve to any object. */
    ownerlessOrphanIndices = null;
    orphanIndexDataPtr = null;
    constructor(instance) {
        this.libredwg = instance;
        this.entityConverter = new LibreEntityConverter(instance);
    }
    convert(data) {
        this.entityConverter.clear();
        this.orphanEntitiesByBlock = null;
        this.ownerlessOrphanIndices = null;
        this.orphanIndexDataPtr = data;
        const db = {
            tables: {
                APPID: {
                    entries: []
                },
                BLOCK_RECORD: {
                    entries: []
                },
                DIMSTYLE: {
                    entries: []
                },
                LAYER: {
                    entries: []
                },
                LTYPE: {
                    entries: []
                },
                STYLE: {
                    entries: []
                },
                VPORT: {
                    entries: []
                }
            },
            objects: {
                DICTIONARY: [],
                IMAGEDEF: [],
                LAYER_FILTER: [],
                LAYER_INDEX: [],
                LAYOUT: [],
                MLEADERSTYLE: [],
                SPATIAL_FILTER: [],
                XRECORD: []
            },
            header: {},
            entities: [],
            classes: []
        };
        const libredwg = this.libredwg;
        this.convertHeader(data, db.header);
        this.convertClasses(data, db.classes);
        this.entityConverter.setClasses(db.classes);
        const num_objects = libredwg.dwg_get_num_objects(data);
        for (let i = 0; i < num_objects; i++) {
            const obj = libredwg.dwg_get_object(data, i);
            if (obj) {
                const tio = this.safeObjectTio(obj);
                if (tio) {
                    const fixedtype = libredwg.dwg_object_get_fixedtype(obj);
                    switch (fixedtype) {
                        case Dwg_Object_Type.DWG_TYPE_LAYER:
                            {
                                const layer = this.convertLayer(tio, obj);
                                db.tables.LAYER.entries.push(layer);
                                this.entityConverter.layers.set(layer.handle, layer.name);
                            }
                            break;
                        case Dwg_Object_Type.DWG_TYPE_LTYPE:
                            {
                                const ltype = this.convertLineType(tio, obj);
                                db.tables.LTYPE.entries.push(ltype);
                                this.entityConverter.ltypes.set(ltype.handle, ltype.name);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        for (let i = 0; i < num_objects; i++) {
            const obj = libredwg.dwg_get_object(data, i);
            if (obj) {
                const tio = this.safeObjectTio(obj);
                if (tio) {
                    const fixedtype = libredwg.dwg_object_get_fixedtype(obj);
                    switch (fixedtype) {
                        case Dwg_Object_Type.DWG_TYPE_APPID:
                            db.tables.APPID.entries.push(this.convertAppId(tio));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_BLOCK_HEADER:
                            {
                                const btr = this.convertBlockRecord(tio, obj);
                                db.tables.BLOCK_RECORD.entries.push(btr);
                                // Store entities in model space and paper space to db.entities to keep the
                                // the consistent data structure as DXF file
                                if (isModelSpace(btr.name) || isPaperSpace(btr.name)) {
                                    btr.entities.forEach(entity => {
                                        db.entities.push(entity);
                                        // Store ATTRIB entity in db.entities to keep the the consistent data
                                        // structure as DXF file
                                        if (entity.type === 'INSERT') {
                                            entity.attribs.forEach(attrib => {
                                                db.entities.push(attrib);
                                            });
                                        }
                                    });
                                }
                            }
                            break;
                        case Dwg_Object_Type.DWG_TYPE_DIMSTYLE:
                            db.tables.DIMSTYLE.entries.push(this.convertDimStyle(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_STYLE:
                            db.tables.STYLE.entries.push(this.convertStyle(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_VPORT:
                            db.tables.VPORT.entries.push(this.convertViewport(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_DICTIONARY:
                            db.objects.DICTIONARY.push(this.convertDictionary(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_IMAGEDEF:
                            db.objects.IMAGEDEF.push(this.convertImageDef(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_LAYERFILTER:
                            db.objects.LAYER_FILTER.push(this.convertLayerFilter(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_LAYER_INDEX:
                            db.objects.LAYER_INDEX.push(this.convertLayerIndex(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_LAYOUT:
                            db.objects.LAYOUT.push(this.convertLayout(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_MLEADERSTYLE:
                            db.objects.MLEADERSTYLE.push(this.convertMLeaderStyle(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_SPATIAL_FILTER:
                            db.objects.SPATIAL_FILTER.push(this.convertSpatialFilter(tio, obj));
                            break;
                        case Dwg_Object_Type.DWG_TYPE_XRECORD:
                            db.objects.XRECORD.push(this.convertXRecord(tio, obj));
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        // Process viewport entities: sort by objectId (handle) and assign viewportId
        const viewportEntities = db.entities.filter(entity => entity.type === 'VIEWPORT');
        viewportEntities.sort((a, b) => {
            // Convert handle to hex number for sorting
            const handleA = parseInt(a.handle, 16);
            const handleB = parseInt(b.handle, 16);
            return handleA - handleB;
        });
        // Assign viewportId starting from 1
        viewportEntities.forEach((viewport, index) => {
            viewport.viewportId = index + 1;
        });
        const thumbnail = libredwg.dwg_bmp(data);
        if (thumbnail?.data?.length) {
            db.thumbnailImage = thumbnail.data;
        }
        return db;
    }
    getConversionStats() {
        return {
            unknownEntityCount: this.entityConverter.unknownEntityCount
        };
    }
    safeObjectTio(obj) {
        const libredwg = this.libredwg;
        try {
            if (libredwg.dwg_object_get_supertype(obj) !=
                Dwg_Object_Supertype.DWG_SUPERTYPE_OBJECT) {
                return null;
            }
            const tio = libredwg.dwg_object_to_object_tio(obj);
            return tio ? tio : null;
        }
        catch {
            return null;
        }
    }
    convertHeader(data, header) {
        const libredwg = this.libredwg;
        HEADER_VARIABLES.forEach(name => {
            let var_name = name;
            if (name == 'DIMBLK' || name == 'DIMBLK1' || name == 'DIMBLK2') {
                var_name = var_name + '_T';
            }
            let value = libredwg.dwg_dynapi_header_data(data, var_name);
            // Get object name if the 'value' is one Dwg_Object_Ref instance.
            // TODO: handle 'CMLSTYLE' correctly
            if (name == 'CELTYPE' ||
                name == 'CLAYER' ||
                name == 'CLAYER' ||
                name == 'DIMSTYLE' ||
                name == 'DIMTXSTY' ||
                name == 'TEXTSTYLE') {
                value = value ? libredwg.dwg_ref_get_object_name(value) : '';
            }
            else if (name == 'DRAGVS') {
                value = value ? (libredwg.dwg_ref_get_absref(value) ?? 2) : 2;
            }
            // @ts-expect-error header variable name
            header[name] = value;
        });
    }
    convertClasses(data, classes) {
        const libredwg = this.libredwg;
        const count = libredwg.dwg_get_num_classes(data);
        for (let index = 0; index < count; index++) {
            const cls = libredwg.dwg_get_class(data, index);
            classes.push({
                dxfName: cls.dxfname,
                cppName: cls.cppname,
                appName: cls.appname,
                capabilitiesFlag: cls.proxyflag,
                instanceCount: cls.num_instances,
                wasAProxyFlag: cls.s_zombie,
                // DWG_TYPE_PROXY_ENTITY = 0x1F2 /* 498 */,
                // DWG_TYPE_PROXY_OBJECT = 0x1F3 /* 499 */,
                isAnEntityFlag: cls.item_class_id === 0x1f2
            });
        }
    }
    convertAppId(item) {
        const libredwg = this.libredwg;
        const name = libredwg.dwg_dynapi_entity_data(item, 'name');
        const flag = libredwg.dwg_dynapi_entity_data(item, 'flag');
        return {
            name: name,
            standardFlag: flag
        };
    }
    convertBlockRecord(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
        // The BLOCK_HEADER has only the abbrevated name, but we want "*D30" instead of "*D".
        // So get full name from BLOCK entity.
        const block = libredwg.dwg_entity_block_header_get_block(item);
        if (block.name) {
            commonAttrs.name = block.name;
        }
        // The number of entities
        const num_owned = libredwg.dwg_dynapi_entity_data(item, 'num_owned');
        const flags = libredwg.dwg_dynapi_entity_data(item, 'flag');
        const description = libredwg.dwg_dynapi_entity_data(item, 'description');
        const basePoint = libredwg.dwg_dynapi_entity_data(item, 'base_pt');
        const insertionUnits = libredwg.dwg_dynapi_entity_data(item, 'insert_units');
        const explodability = libredwg.dwg_dynapi_entity_data(item, 'explodable');
        const scalability = libredwg.dwg_dynapi_entity_data(item, 'block_scaling');
        const layout_ptr = libredwg.dwg_dynapi_entity_data(item, 'layout');
        const layout = (libredwg.dwg_ref_get_id(layout_ptr) ?? '');
        let bmpPreview;
        const bmpPreviewBinaryData = libredwg.dwg_entity_block_header_get_preview(item);
        if (bmpPreviewBinaryData && bmpPreviewBinaryData.length > 0) {
            bmpPreview = uint8ArrayToHexString(bmpPreviewBinaryData);
        }
        // Sometimes function get_first_owned_entity returns 0 when trying to iterate entities in one block.
        // I guess it is one bug on libredwg. I logged [one bug](https://github.com/LibreDWG/libredwg/issues/1199)
        // on libredwg too. In this time, I try to use property 'entities' of block header to iterate entities.
        let entities = this.convertEntities(obj, commonAttrs.handle);
        if (!entities || entities.length == 0) {
            entities = [];
            const entities_ptr = libredwg.dwg_dynapi_entity_data(item, 'entities');
            if (entities_ptr) {
                const object_ref_ptr_array = libredwg.dwg_ptr_to_object_ref_ptr_array(entities_ptr, num_owned);
                const converter = this.entityConverter;
                for (let index = 0; index < num_owned; index++) {
                    const object = libredwg.dwg_ref_get_object(object_ref_ptr_array[index]);
                    const entity = converter.convert(object);
                    if (entity) {
                        entity.ownerBlockRecordSoftId = commonAttrs.handle;
                        entities.push(entity);
                    }
                }
            }
        }
        // Some DWG writers (including LibreDWG's own) declare first_entity /
        // last_entity handles that resolve to no object, or only link a
        // partial ownership chain. Fall back to entity objects whose owner
        // (ownerhandle / entmode via dwg_entity_owner) names this block.
        // For *Model_Space only, also pick up entities with no resolvable owner.
        if (this.orphanIndexDataPtr != null) {
            const orphans = this.convertOrphanOwnedEntities(this.orphanIndexDataPtr, obj, commonAttrs.handle, isModelSpace(commonAttrs.name) === true);
            if (orphans.length) {
                if (entities.length === 0) {
                    entities = orphans;
                }
                else {
                    const seen = new Set(entities.map(e => e.handle));
                    for (const entity of orphans) {
                        if (!seen.has(entity.handle)) {
                            entities.push(entity);
                        }
                    }
                }
            }
        }
        return {
            ...commonAttrs,
            flags: flags,
            description: description,
            basePoint: basePoint,
            layout: layout,
            insertionUnits: insertionUnits,
            explodability: explodability,
            scalability: scalability,
            bmpPreview: bmpPreview,
            entities: entities
        };
    }
    convertEntities(obj, ownerHandle) {
        const libredwg = this.libredwg;
        const converter = this.entityConverter;
        const entities = [];
        let next = libredwg.get_first_owned_entity(obj);
        while (next) {
            const entity = converter.convert(next);
            if (entity) {
                entity.ownerBlockRecordSoftId = ownerHandle;
                entities.push(entity);
            }
            next = libredwg.get_next_owned_entity(obj, next);
        }
        return entities;
    }
    /**
     * Builds (once) a map of BLOCK_HEADER object pointer → entity object indices
     * for entities that are not reachable through the ownership chain, then
     * converts the entities owned by `blockHeaderPtr`.
     *
     * @param includeOwnerless - When true (only for *Model_Space), also convert
     *   entities that still have no resolvable owner after ownerhandle + entmode
     *   fallback via dwg_entity_owner.
     */
    convertOrphanOwnedEntities(data, blockHeaderPtr, ownerHandle, includeOwnerless) {
        this.ensureOrphanEntityIndex(data);
        const byBlock = this.orphanEntitiesByBlock ?? new Map();
        const owned = byBlock.get(blockHeaderPtr) ?? [];
        const ownerless = includeOwnerless && this.ownerlessOrphanIndices
            ? this.ownerlessOrphanIndices
            : [];
        const indices = owned.length && ownerless.length
            ? owned.concat(ownerless)
            : owned.length
                ? owned
                : ownerless;
        if (indices.length === 0) {
            return [];
        }
        const libredwg = this.libredwg;
        const converter = this.entityConverter;
        const entities = [];
        for (const index of indices) {
            const object = libredwg.dwg_get_object(data, index);
            const entity = converter.convert(object);
            if (entity) {
                entity.ownerBlockRecordSoftId = ownerHandle;
                entities.push(entity);
            }
        }
        return entities;
    }
    ensureOrphanEntityIndex(data) {
        if (this.orphanEntitiesByBlock) {
            return;
        }
        const libredwg = this.libredwg;
        const numObjects = libredwg.dwg_get_num_objects(data);
        const indexByEntityPtr = new Map();
        const entityIndices = [];
        const blockHeaderPtrs = [];
        // dwg_entity_owner returns a BLOCK_HEADER TIO pointer; map it back to the
        // Dwg_Object* used as the orphan-index key.
        const blockObjByTio = new Map();
        for (let i = 0; i < numObjects; i++) {
            const obj = libredwg.dwg_get_object(data, i);
            if (!obj)
                continue;
            if (libredwg.dwg_object_get_supertype(obj) ===
                Dwg_Object_Supertype.DWG_SUPERTYPE_ENTITY) {
                entityIndices.push(i);
                indexByEntityPtr.set(obj, i);
            }
            else if (libredwg.dwg_object_get_fixedtype(obj) ===
                Dwg_Object_Type.DWG_TYPE_BLOCK_HEADER) {
                blockHeaderPtrs.push(obj);
                const tio = libredwg.dwg_object_to_object_tio(obj);
                if (tio)
                    blockObjByTio.set(tio, obj);
            }
        }
        const claimed = new Set();
        for (const blockHeader of blockHeaderPtrs) {
            let current = libredwg.get_first_owned_entity(blockHeader);
            let steps = 0;
            while (current && steps++ <= entityIndices.length) {
                const index = indexByEntityPtr.get(current);
                if (index === undefined || claimed.has(index))
                    break;
                claimed.add(index);
                current = libredwg.get_next_owned_entity(blockHeader, current);
            }
        }
        const orphansByBlock = new Map();
        const ownerless = [];
        for (const index of entityIndices) {
            if (claimed.has(index))
                continue;
            const obj = libredwg.dwg_get_object(data, index);
            const etio = obj ? libredwg.dwg_object_to_entity_tio(obj) : 0;
            // Resolves ownerhandle, then entmode → MSPACE/PSPACE (LibreDWG).
            const ownerTio = etio ? libredwg.dwg_entity_owner(etio) : 0;
            const owner = ownerTio ? (blockObjByTio.get(ownerTio) ?? 0) : 0;
            if (owner) {
                const owned = orphansByBlock.get(owner);
                if (owned)
                    owned.push(index);
                else
                    orphansByBlock.set(owner, [index]);
            }
            else {
                ownerless.push(index);
            }
        }
        this.orphanEntitiesByBlock = orphansByBlock;
        this.ownerlessOrphanIndices = ownerless;
    }
    convertDimStyle(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
        const DIMTOL = libredwg.dwg_dynapi_entity_data(item, 'DIMTOL');
        const DIMLIM = libredwg.dwg_dynapi_entity_data(item, 'DIMLIM');
        const DIMTIH = libredwg.dwg_dynapi_entity_data(item, 'DIMTIH');
        const DIMTOH = libredwg.dwg_dynapi_entity_data(item, 'DIMTOH');
        const DIMSE1 = libredwg.dwg_dynapi_entity_data(item, 'DIMSE1');
        const DIMSE2 = libredwg.dwg_dynapi_entity_data(item, 'DIMSE2');
        const DIMALT = libredwg.dwg_dynapi_entity_data(item, 'DIMALT');
        const DIMTOFL = libredwg.dwg_dynapi_entity_data(item, 'DIMTOFL');
        const DIMSAH = libredwg.dwg_dynapi_entity_data(item, 'DIMSAH');
        const DIMTIX = libredwg.dwg_dynapi_entity_data(item, 'DIMTIX');
        const DIMSOXD = libredwg.dwg_dynapi_entity_data(item, 'DIMSOXD');
        const DIMALTD = libredwg.dwg_dynapi_entity_data(item, 'DIMALTD');
        const DIMZIN = libredwg.dwg_dynapi_entity_data(item, 'DIMZIN');
        const DIMSD1 = libredwg.dwg_dynapi_entity_data(item, 'DIMSD1');
        const DIMSD2 = libredwg.dwg_dynapi_entity_data(item, 'DIMSD2');
        const DIMTOLJ = libredwg.dwg_dynapi_entity_data(item, 'DIMTOLJ');
        const DIMJUST = libredwg.dwg_dynapi_entity_data(item, 'DIMJUST');
        const DIMFIT = libredwg.dwg_dynapi_entity_data(item, 'DIMFIT');
        const DIMUPT = libredwg.dwg_dynapi_entity_data(item, 'DIMUPT');
        const DIMTZIN = libredwg.dwg_dynapi_entity_data(item, 'DIMTZIN');
        const DIMALTZ = libredwg.dwg_dynapi_entity_data(item, 'DIMALTZ');
        const DIMALTTZ = libredwg.dwg_dynapi_entity_data(item, 'DIMALTTZ');
        const DIMTAD = libredwg.dwg_dynapi_entity_data(item, 'DIMTAD');
        const DIMUNIT = libredwg.dwg_dynapi_entity_data(item, 'DIMUNIT');
        const DIMAUNIT = libredwg.dwg_dynapi_entity_data(item, 'DIMAUNIT');
        const DIMDEC = libredwg.dwg_dynapi_entity_data(item, 'DIMDEC');
        const DIMTDEC = libredwg.dwg_dynapi_entity_data(item, 'DIMTDEC');
        const DIMALTU = libredwg.dwg_dynapi_entity_data(item, 'DIMALTU');
        const DIMALTTD = libredwg.dwg_dynapi_entity_data(item, 'DIMALTTD');
        const DIMSCALE = libredwg.dwg_dynapi_entity_data(item, 'DIMSCALE');
        const DIMASZ = libredwg.dwg_dynapi_entity_data(item, 'DIMASZ');
        const DIMEXO = libredwg.dwg_dynapi_entity_data(item, 'DIMEXO');
        const DIMDLI = libredwg.dwg_dynapi_entity_data(item, 'DIMDLI');
        const DIMEXE = libredwg.dwg_dynapi_entity_data(item, 'DIMEXE');
        const DIMRND = libredwg.dwg_dynapi_entity_data(item, 'DIMRND');
        const DIMDLE = libredwg.dwg_dynapi_entity_data(item, 'DIMDLE');
        const DIMTP = libredwg.dwg_dynapi_entity_data(item, 'DIMTP');
        const DIMTM = libredwg.dwg_dynapi_entity_data(item, 'DIMTM');
        const DIMFXL = libredwg.dwg_dynapi_entity_data(item, 'DIMFXL');
        const DIMJOGANG = libredwg.dwg_dynapi_entity_data(item, 'DIMJOGANG');
        const DIMTFILL = libredwg.dwg_dynapi_entity_data(item, 'DIMTFILL');
        const DIMTFILLCLR = libredwg.dwg_dynapi_entity_data(item, 'DIMTFILLCLR');
        const DIMAZIN = libredwg.dwg_dynapi_entity_data(item, 'DIMAZIN');
        const DIMARCSYM = libredwg.dwg_dynapi_entity_data(item, 'DIMARCSYM');
        const DIMTXT = libredwg.dwg_dynapi_entity_data(item, 'DIMTXT');
        const DIMCEN = libredwg.dwg_dynapi_entity_data(item, 'DIMCEN');
        const DIMTSZ = libredwg.dwg_dynapi_entity_data(item, 'DIMTSZ');
        const DIMALTF = libredwg.dwg_dynapi_entity_data(item, 'DIMALTF');
        const DIMLFAC = libredwg.dwg_dynapi_entity_data(item, 'DIMLFAC');
        const DIMTVP = libredwg.dwg_dynapi_entity_data(item, 'DIMTVP');
        const DIMTFAC = libredwg.dwg_dynapi_entity_data(item, 'DIMTFAC');
        const DIMGAP = libredwg.dwg_dynapi_entity_data(item, 'DIMGAP');
        const DIMPOST = libredwg.dwg_dynapi_entity_data(item, 'DIMPOST');
        const DIMAPOST = libredwg.dwg_dynapi_entity_data(item, 'DIMAPOST');
        const DIMBLK_T = libredwg.dwg_dynapi_entity_data(item, 'DIMBLK_T');
        const DIMBLK1_T = libredwg.dwg_dynapi_entity_data(item, 'DIMBLK1_T');
        const DIMBLK2_T = libredwg.dwg_dynapi_entity_data(item, 'DIMBLK2_T');
        const DIMALTRND = libredwg.dwg_dynapi_entity_data(item, 'DIMALTRND');
        const DIMCLRD_N = libredwg.dwg_dynapi_entity_data(item, 'DIMCLRD_N');
        const DIMCLRE_N = libredwg.dwg_dynapi_entity_data(item, 'DIMCLRE_N');
        const DIMCLRT_N = libredwg.dwg_dynapi_entity_data(item, 'DIMCLRT_N');
        const DIMCLRD = libredwg.dwg_dynapi_entity_data(item, 'DIMCLRD');
        const DIMCLRE = libredwg.dwg_dynapi_entity_data(item, 'DIMCLRE');
        const DIMCLRT = libredwg.dwg_dynapi_entity_data(item, 'DIMCLRT');
        const DIMADEC = libredwg.dwg_dynapi_entity_data(item, 'DIMADEC');
        const DIMFRAC = libredwg.dwg_dynapi_entity_data(item, 'DIMFRAC');
        const DIMLUNIT = libredwg.dwg_dynapi_entity_data(item, 'DIMLUNIT');
        const DIMDSEP = libredwg.dwg_dynapi_entity_data(item, 'DIMDSEP');
        const DIMTMOVE = libredwg.dwg_dynapi_entity_data(item, 'DIMTMOVE');
        const DIMATFIT = libredwg.dwg_dynapi_entity_data(item, 'DIMATFIT');
        const DIMFXLON = libredwg.dwg_dynapi_entity_data(item, 'DIMFXLON');
        const DIMTXTDIRECTION = libredwg.dwg_dynapi_entity_data(item, 'DIMTXTDIRECTION');
        const DIMALTMZF = libredwg.dwg_dynapi_entity_data(item, 'DIMALTMZF');
        const DIMALTMZS = libredwg.dwg_dynapi_entity_data(item, 'DIMALTMZS');
        const DIMMZF = libredwg.dwg_dynapi_entity_data(item, 'DIMMZF');
        const DIMMZS = libredwg.dwg_dynapi_entity_data(item, 'DIMMZS');
        const DIMLWD = libredwg.dwg_dynapi_entity_data(item, 'DIMLWD');
        const DIMLWE = libredwg.dwg_dynapi_entity_data(item, 'DIMLWE');
        const DIMTXSTY_Ptr = libredwg.dwg_dynapi_entity_data(item, 'DIMTXSTY');
        const DIMTXSTY = libredwg.dwg_ref_get_absref(DIMTXSTY_Ptr) ?? undefined;
        const DIMLDRBLK_Ptr = libredwg.dwg_dynapi_entity_data(item, 'DIMLDRBLK');
        const DIMLDRBLK = libredwg.dwg_ref_get_absref(DIMLDRBLK_Ptr) ?? undefined;
        return {
            ...commonAttrs,
            DIMPOST: DIMPOST,
            DIMAPOST: DIMAPOST,
            DIMBLK: DIMBLK_T,
            DIMBLK1: DIMBLK1_T,
            DIMBLK2: DIMBLK2_T,
            DIMSCALE: DIMSCALE,
            DIMASZ: DIMASZ,
            DIMEXO: DIMEXO,
            DIMDLI: DIMDLI,
            DIMEXE: DIMEXE,
            DIMRND: DIMRND,
            DIMDLE: DIMDLE,
            DIMTP: DIMTP,
            DIMTM: DIMTM,
            DIMTXT: DIMTXT,
            DIMCEN: DIMCEN,
            DIMTSZ: DIMTSZ,
            DIMALTF: DIMALTF,
            DIMLFAC: DIMLFAC,
            DIMTVP: DIMTVP,
            DIMTFAC: DIMTFAC,
            DIMGAP: DIMGAP,
            DIMALTRND: DIMALTRND,
            DIMTOL: DIMTOL,
            DIMLIM: DIMLIM,
            DIMTIH: DIMTIH,
            DIMTOH: DIMTOH,
            DIMSE1: DIMSE1,
            DIMSE2: DIMSE2,
            DIMTAD: DIMTAD,
            DIMZIN: DIMZIN,
            DIMAZIN: DIMAZIN,
            DIMALT: DIMALT,
            DIMALTD: DIMALTD,
            DIMTOFL: DIMTOFL,
            DIMSAH: DIMSAH,
            DIMTIX: DIMTIX,
            DIMSOXD: DIMSOXD,
            DIMCLRD: DIMCLRD,
            DIMCLRE: DIMCLRE,
            DIMCLRT: DIMCLRT,
            DIMADEC: DIMADEC,
            DIMUNIT: DIMUNIT,
            DIMDEC: DIMDEC,
            DIMTDEC: DIMTDEC,
            DIMALTU: DIMALTU,
            DIMALTTD: DIMALTTD,
            DIMAUNIT: DIMAUNIT,
            DIMFRAC: DIMFRAC,
            DIMLUNIT: DIMLUNIT,
            DIMDSEP: String.fromCharCode(DIMDSEP),
            DIMTMOVE: DIMTMOVE,
            DIMJUST: DIMJUST,
            DIMSD1: DIMSD1,
            DIMSD2: DIMSD2,
            DIMTOLJ: DIMTOLJ,
            DIMTZIN: DIMTZIN,
            DIMALTZ: DIMALTZ,
            DIMALTTZ: DIMALTTZ,
            DIMFIT: DIMFIT,
            DIMUPT: DIMUPT,
            DIMATFIT: DIMATFIT,
            DIMTXSTY: DIMTXSTY,
            DIMLDRBLK: DIMLDRBLK,
            DIMLWD: DIMLWD,
            DIMLWE: DIMLWE,
            DIMFXL: DIMFXL,
            DIMJOGANG: DIMJOGANG,
            DIMTFILL: DIMTFILL,
            DIMTFILLCLR: DIMTFILLCLR,
            DIMARCSYM: DIMARCSYM,
            DIMCLRD_N: DIMCLRD_N,
            DIMCLRE_N: DIMCLRE_N,
            DIMCLRT_N: DIMCLRT_N,
            DIMFXLON: DIMFXLON,
            DIMTXTDIRECTION: DIMTXTDIRECTION,
            DIMALTMZF: DIMALTMZF,
            DIMALTMZS: DIMALTMZS,
            DIMMZF: DIMMZF,
            DIMMZS: DIMMZS
        };
    }
    convertLayer(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
        const flag = libredwg.dwg_dynapi_entity_data(item, 'flag');
        const frozen = libredwg.dwg_dynapi_entity_data(item, 'frozen');
        const off = libredwg.dwg_dynapi_entity_data(item, 'off');
        const frozenInNew = libredwg.dwg_dynapi_entity_data(item, 'frozen_in_new');
        const locked = libredwg.dwg_dynapi_entity_data(item, 'locked');
        const plotFlag = libredwg.dwg_dynapi_entity_data(item, 'plotflag');
        const linewt = libredwg.dwg_dynapi_entity_data(item, 'linewt');
        const color = libredwg.dwg_dynapi_entity_data(item, 'color');
        const ltypeRef = libredwg.dwg_dynapi_entity_data(item, 'ltype');
        let ltypeName = 'Continuous';
        if (ltypeRef) {
            try {
                ltypeName = libredwg.dwg_ref_get_object_name(ltypeRef);
            }
            catch {
                // ref may be invalid in some DWG files
            }
        }
        // - 0xc0 for ByLayer (also c3 and rgb of 0x100)
        // - 0xc1 for ByBlock (also c3 and rgb of 0)
        // - 0xc2 for entities (default), with names with an additional name flag RC
        // - 0xc3 for truecolor
        // - 0xc5 for foreground color
        // - 0xc8 for none (also c3 and rgb of 0x101)
        const method = color.method;
        let colorIndex = 256;
        let rgbColor = 0xffffff;
        // NOTE: Some older DWG formats use method=0x0 and provide the ACI index via color.index.
        if (method === 0xc3 || ((color.rgb >>> 24) & 0xff) === 0xc3) {
            colorIndex = color.rgb & 0x000000ff;
        }
        else if (method == 0xc2 || ((color.rgb >>> 24) & 0xff) === 0xc2) {
            rgbColor = color.rgb & 0x00ffffff;
        }
        else if (color.index >= 1 && color.index <= 255) {
            // Older DWG format: ACI index is directly available in color.index.
            colorIndex = color.index;
        }
        return {
            ...commonAttrs,
            standardFlag: flag,
            colorIndex: colorIndex,
            color: rgbColor,
            colorName: color.name,
            transparency: color.alpha,
            lineType: ltypeName,
            frozen: frozen != 0,
            off: off != 0,
            frozenInNew: frozenInNew != 0,
            locked: locked != 0,
            plotFlag: plotFlag,
            lineweight: linewt,
            plotStyleNameObjectId: '',
            materialObjectId: ''
        };
    }
    convertLineType(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
        const flag = libredwg.dwg_dynapi_entity_data(item, 'flag');
        const description = libredwg.dwg_dynapi_entity_data(item, 'description');
        const numDashes = libredwg.dwg_dynapi_entity_data(item, 'numdashes');
        const patternLen = libredwg.dwg_dynapi_entity_data(item, 'pattern_len');
        const dashes = libredwg.dwg_dynapi_entity_data(item, 'dashes');
        const dashArray = dashes
            ? libredwg.dwg_ptr_to_ltype_dash_array(dashes, numDashes)
            : [];
        return {
            ...commonAttrs,
            description: description,
            standardFlag: flag,
            numberOfLineTypes: numDashes,
            totalPatternLength: patternLen,
            pattern: this.convertLineTypePattern(dashArray)
        };
    }
    convertLineTypePattern(dashes) {
        const patterns = [];
        dashes.forEach(dash => {
            patterns.push({
                elementLength: dash.length || 0,
                // DXF 74: 1=absolute rotation, 2=text, 4=shape
                elementTypeFlag: dash.shape_flag || 0,
                // DXF 75: shape number (when flag has bit 4)
                shapeNumber: dash.complex_shapecode,
                // TODO: convert style handle to style object id
                // styleObjectId: dash.style,
                scale: dash.scale,
                rotation: dash.rotation,
                offsetX: dash.x_offset,
                offsetY: dash.y_offset,
                text: dash.text
            });
        });
        return patterns;
    }
    convertStyle(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
        const standardFlag = libredwg.dwg_dynapi_entity_data(item, 'flag');
        const widthFactor = libredwg.dwg_dynapi_entity_data(item, 'width_factor');
        const obliqueAngle = libredwg.dwg_dynapi_entity_data(item, 'oblique_angle');
        const textGenerationFlag = libredwg.dwg_dynapi_entity_data(item, 'generation');
        const lastHeight = libredwg.dwg_dynapi_entity_data(item, 'last_height');
        const font = libredwg.dwg_dynapi_entity_data(item, 'font_file');
        const bigFont = libredwg.dwg_dynapi_entity_data(item, 'bigfont_file');
        return {
            ...commonAttrs,
            standardFlag: standardFlag,
            fixedTextHeight: 0, // TODO: Set the correct value
            widthFactor: widthFactor,
            obliqueAngle: obliqueAngle,
            textGenerationFlag: textGenerationFlag,
            lastHeight: lastHeight,
            font: font,
            bigFont: bigFont
        };
    }
    convertViewport(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonTableEntryAttrs(item, obj);
        const standardFlag = libredwg.dwg_dynapi_entity_data(item, 'flag');
        const viewHeight = libredwg.dwg_dynapi_entity_data(item, 'VIEWSIZE');
        const aspectRatio = libredwg.dwg_dynapi_entity_data(item, 'aspect_ratio');
        const center = libredwg.dwg_dynapi_entity_data(item, 'VIEWCTR');
        const viewTarget = libredwg.dwg_dynapi_entity_data(item, 'view_target');
        const viewDirectionFromTarget = libredwg.dwg_dynapi_entity_data(item, 'VIEWDIR');
        const viewTwistAngle = libredwg.dwg_dynapi_entity_data(item, 'view_twist');
        const lensLength = libredwg.dwg_dynapi_entity_data(item, 'lens_length');
        const frontClippingPlane = libredwg.dwg_dynapi_entity_data(item, 'front_clip_z');
        const backClippingPlane = libredwg.dwg_dynapi_entity_data(item, 'back_clip_z');
        const viewMode = libredwg.dwg_dynapi_entity_data(item, 'VIEWMODE');
        const renderMode = libredwg.dwg_dynapi_entity_data(item, 'render_mode');
        const isDefaultLightingOn = libredwg.dwg_dynapi_entity_data(item, 'use_default_lights') != 0;
        const defaultLightningType = libredwg.dwg_dynapi_entity_data(item, 'default_lightning_type');
        const brightness = libredwg.dwg_dynapi_entity_data(item, 'brightness');
        const contrast = libredwg.dwg_dynapi_entity_data(item, 'contrast');
        const ambient_color = libredwg.dwg_dynapi_entity_data(item, 'ambient_color');
        // ViewportTableRecord
        const lowerLeftCorner = libredwg.dwg_dynapi_entity_data(item, 'lower_left');
        const upperRightCorner = libredwg.dwg_dynapi_entity_data(item, 'upper_right');
        // TODO: Not sure whether 'circleSides' is equal to 'circle_zoom'
        const circleSides = libredwg.dwg_dynapi_entity_data(item, 'circle_zoom');
        const ucsIconSetting = libredwg.dwg_dynapi_entity_data(item, 'UCSICON');
        // TODO: Not sure whether 'gridSpacing' is equal to 'GRIDUNIT'
        const gridSpacing = libredwg.dwg_dynapi_entity_data(item, 'GRIDUNIT');
        const snapRotationAngle = libredwg.dwg_dynapi_entity_data(item, 'SNAPANG');
        const snapBasePoint = libredwg.dwg_dynapi_entity_data(item, 'SNAPBASE');
        // TODO: Not sure whether 'snapSpacing' is equal to 'SNAPUNIT'
        const snapSpacing = libredwg.dwg_dynapi_entity_data(item, 'SNAPUNIT');
        const ucsOrigin = libredwg.dwg_dynapi_entity_data(item, 'ucsorg');
        const ucsXAxis = libredwg.dwg_dynapi_entity_data(item, 'ucsxdir');
        const ucsYAxis = libredwg.dwg_dynapi_entity_data(item, 'ucsydir');
        const elevation = libredwg.dwg_dynapi_entity_data(item, 'ucs_elevation');
        const majorGridLines = libredwg.dwg_dynapi_entity_data(item, 'grid_major');
        const background = libredwg.dwg_dynapi_entity_data(item, 'background');
        const backgroundObjectId = background
            ? (libredwg.dwg_ref_get_id(background) ?? '')
            : undefined;
        const visualstyle = libredwg.dwg_dynapi_entity_data(item, 'visualstyle');
        const visualStyleObjectId = visualstyle
            ? (libredwg.dwg_ref_get_id(visualstyle) ?? '')
            : undefined;
        // BITCODE_B UCSFOLLOW;
        // BITCODE_B FASTZOOM;
        // BITCODE_B GRIDMODE;     /* DXF 76: on or off */
        // BITCODE_B SNAPMODE;     /* DXF 75: on or off */
        // BITCODE_B SNAPSTYLE;
        // BITCODE_BS SNAPISOPAIR;
        // BITCODE_B ucs_at_origin;
        // BITCODE_B UCSVP;
        // BITCODE_BS UCSORTHOVIEW;
        // BITCODE_BS grid_flags; /* bit 1: bound to limits, bit 2: adaptive */
        // BITCODE_H sun;
        // BITCODE_H named_ucs;
        // BITCODE_H base_ucs;
        return {
            ...commonAttrs,
            standardFlag: standardFlag,
            lowerLeftCorner: lowerLeftCorner,
            upperRightCorner: upperRightCorner,
            center: center,
            snapBasePoint: snapBasePoint,
            snapSpacing: snapSpacing,
            gridSpacing: gridSpacing,
            viewDirectionFromTarget: viewDirectionFromTarget,
            viewTarget: viewTarget,
            lensLength: lensLength,
            frontClippingPlane: frontClippingPlane,
            backClippingPlane: backClippingPlane,
            viewHeight: viewHeight,
            aspectRatio: aspectRatio,
            snapRotationAngle: snapRotationAngle,
            viewTwistAngle: viewTwistAngle,
            circleSides: circleSides,
            frozenLayers: [], // TODO: Set the correct value
            styleSheet: '', // TODO: Set the correct value
            renderMode: renderMode,
            viewMode: viewMode,
            ucsIconSetting: ucsIconSetting,
            ucsOrigin: ucsOrigin,
            ucsXAxis: ucsXAxis,
            ucsYAxis: ucsYAxis,
            orthographicType: 0, // TODO: Set the correct value
            elevation: elevation,
            shadePlotSetting: 0, // TODO: Set the correct value
            majorGridLines: majorGridLines,
            backgroundObjectId: backgroundObjectId,
            // shadePlotObjectId: undefined,
            visualStyleObjectId: visualStyleObjectId,
            isDefaultLightingOn: isDefaultLightingOn,
            defaultLightingType: defaultLightningType,
            brightness: brightness,
            contrast: contrast,
            // TODO: Not sure whether 'index' or 'rgb' should be used
            ambientColor: ambient_color.index
        };
    }
    getCommonTableEntryAttrs(tio, obj) {
        const libredwg = this.libredwg;
        const object_tio = libredwg.dwg_object_get_tio(obj);
        const ownerhandle = libredwg.dwg_object_object_get_ownerhandle_object(object_tio);
        const handle = libredwg.dwg_object_get_handle_object(obj);
        return {
            handle: idToString(handle.value),
            ownerHandle: idToString(ownerhandle.absolute_ref),
            name: libredwg.dwg_dynapi_entity_data(tio, 'name')
        };
    }
    convertDictionary(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        const isHardOwner = libredwg.dwg_dynapi_entity_data(item, 'is_hardowner');
        const cloningFlag = libredwg.dwg_dynapi_entity_data(item, 'cloning');
        const numitems = libredwg.dwg_dynapi_entity_data(item, 'numitems');
        const itemhandles_ptr = libredwg.dwg_dynapi_entity_data(item, 'itemhandles');
        const itemhandles = libredwg.dwg_ptr_to_object_ref_array(itemhandles_ptr, numitems);
        const texts = libredwg.dwg_object_dictionary_get_texts(obj);
        const entries = {};
        itemhandles.forEach((handle, index) => (entries[texts[index]] = idToString(handle.absolute_ref)));
        return {
            ...commonAttrs,
            isHardOwner: !!isHardOwner,
            cloningFlag: cloningFlag,
            entries: entries
        };
    }
    convertImageDef(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        // const classVersion = libredwg.dwg_dynapi_entity_data<number>(item, 'class_version')
        const size = libredwg.dwg_dynapi_entity_data(item, 'image_size');
        const fileName = libredwg.dwg_dynapi_entity_data(item, 'file_path');
        const isLoaded = libredwg.dwg_dynapi_entity_data(item, 'is_loaded');
        const sizeOfOnePixel = libredwg.dwg_dynapi_entity_data(item, 'pixel_size');
        const resolutionUnits = libredwg.dwg_dynapi_entity_data(item, 'resunits');
        return {
            ...commonAttrs,
            fileName: fileName,
            size: size,
            sizeOfOnePixel: sizeOfOnePixel,
            isLoaded: isLoaded,
            resolutionUnits: resolutionUnits
        };
    }
    convertLayerFilter(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        const numNames = libredwg.dwg_dynapi_entity_data(item, 'num_names') ?? 0;
        const namesPtr = libredwg.dwg_dynapi_entity_data(item, 'names');
        const layerNames = namesPtr && numNames > 0
            ? libredwg
                .dwg_ptr_to_wchar_string_array(namesPtr, numNames)
                .filter((name) => name != null && name !== '')
            : [];
        return {
            ...commonAttrs,
            ...(layerNames.length ? { layerNames } : {})
        };
    }
    convertLayerIndex(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        const timeStamp = libredwg.dwg_dynapi_entity_data(item, 'last_updated');
        const numEntries = libredwg.dwg_dynapi_entity_data(item, 'num_entries') ?? 0;
        const entriesPtr = libredwg.dwg_dynapi_entity_data(item, 'entries');
        const entrySize = libredwg.dwg_dynapi_subclass_size('LAYER_entry');
        const layerNames = [];
        const idBufferIds = [];
        const idBufferEntryCounts = [];
        if (entriesPtr && entrySize > 0) {
            for (let i = 0; i < numEntries; i++) {
                const entryPtr = entriesPtr + i * entrySize;
                const name = libredwg.dwg_dynapi_subclass_data(entryPtr, 'LAYER_entry', 'name');
                // Keep parallel arrays aligned with entries even when name is absent.
                layerNames.push(name ?? '');
                const handleRef = libredwg.dwg_dynapi_subclass_data(entryPtr, 'LAYER_entry', 'handle');
                idBufferIds.push(handleRef ? (libredwg.dwg_ref_get_id(handleRef) ?? '') : '');
                idBufferEntryCounts.push(libredwg.dwg_dynapi_subclass_data(entryPtr, 'LAYER_entry', 'numlayers') ?? 0);
            }
        }
        return {
            ...commonAttrs,
            ...(timeStamp != null ? { timeStamp } : {}),
            ...(layerNames.length ? { layerNames } : {}),
            ...(idBufferIds.length ? { idBufferIds } : {}),
            ...(idBufferEntryCounts.length ? { idBufferEntryCounts } : {})
        };
    }
    convertLayout(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        // AcDbLayout
        const layoutName = libredwg.dwg_dynapi_entity_data(item, 'layout_name');
        const tabOrder = libredwg.dwg_dynapi_entity_data(item, 'tab_order');
        const controlFlag = libredwg.dwg_dynapi_entity_data(item, 'layout_flags');
        const insertionPoint = libredwg.dwg_dynapi_entity_data(item, 'INSBASE');
        const minLimit = libredwg.dwg_dynapi_entity_data(item, 'LIMMIN');
        const maxLimit = libredwg.dwg_dynapi_entity_data(item, 'LIMMAX');
        const ucsOrigin = libredwg.dwg_dynapi_entity_data(item, 'UCSORG');
        const ucsXAxis = libredwg.dwg_dynapi_entity_data(item, 'UCSXDIR');
        const ucsYAxis = libredwg.dwg_dynapi_entity_data(item, 'UCSYDIR');
        const orthographicType = libredwg.dwg_dynapi_entity_data(item, 'UCSORTHOVIEW');
        const minExtent = libredwg.dwg_dynapi_entity_data(item, 'EXTMIN');
        const maxExtent = libredwg.dwg_dynapi_entity_data(item, 'EXTMAX');
        const elevation = libredwg.dwg_dynapi_entity_data(item, 'ucs_elevation');
        const block_header_ref = libredwg.dwg_dynapi_entity_data(item, 'block_header');
        const paperSpaceTableId = (libredwg.dwg_ref_get_id(block_header_ref) ?? '');
        const active_viewport_ref = libredwg.dwg_dynapi_entity_data(item, 'active_viewport');
        const viewportId = (libredwg.dwg_ref_get_id(active_viewport_ref) ?? '');
        const named_ucs_ref = libredwg.dwg_dynapi_entity_data(item, 'named_ucs');
        const namedUcsId = named_ucs_ref
            ? (libredwg.dwg_ref_get_id(named_ucs_ref) ?? '')
            : undefined;
        // BITCODE_H base_ucs;
        // BITCODE_BL num_viewports; // r2004+
        // BITCODE_H *viewports;     // r2004+
        return {
            ...commonAttrs,
            layoutName: layoutName,
            controlFlag: controlFlag,
            tabOrder: tabOrder,
            minLimit: minLimit,
            maxLimit: maxLimit,
            insertionPoint: insertionPoint,
            minExtent: minExtent,
            maxExtent: maxExtent,
            elevation: elevation,
            ucsOrigin: ucsOrigin,
            ucsXAxis: ucsXAxis,
            ucsYAxis: ucsYAxis,
            orthographicType: orthographicType,
            paperSpaceTableId: paperSpaceTableId,
            viewportId: viewportId,
            namedUcsId: namedUcsId,
            // orthographicUcsId?: string;
            shadePlotId: '' // TODO: Set the correct value
        };
    }
    convertMLeaderStyle(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        const objectVal = (field) => libredwg.dwg_dynapi_entity_data(item, field);
        const refToId = (ref) => libredwg.dwg_ref_get_id(ref);
        const asBool = (value) => value > 0;
        const mleaderColor = (color) => color != null ? dwgColorToMLeaderRawColor(color) : undefined;
        return {
            ...commonAttrs,
            subclassMarker: 'AcDbMLeaderStyle',
            unknown1: objectVal('class_version'),
            contentType: objectVal('content_type'),
            drawMLeaderOrderType: objectVal('mleader_order'),
            drawLeaderOrderType: objectVal('leader_order'),
            maxLeaderSegmentPoints: objectVal('max_points'),
            firstSegmentAngleConstraint: objectVal('first_seg_angle'),
            secondSegmentAngleConstraint: objectVal('second_seg_angle'),
            leaderLineType: objectVal('type'),
            leaderLineColor: mleaderColor(objectVal('line_color')),
            leaderLineTypeId: refToId(objectVal('line_type')),
            leaderLineWeight: objectVal('linewt'),
            landingEnabled: asBool(objectVal('has_landing')),
            landingGap: objectVal('landing_gap'),
            doglegEnabled: asBool(objectVal('has_dogleg')),
            doglegLength: objectVal('landing_dist'),
            description: objectVal('description'),
            arrowheadId: refToId(objectVal('arrow_head')),
            arrowheadSize: objectVal('arrow_head_size'),
            defaultMTextContents: objectVal('text_default'),
            textStyleId: refToId(objectVal('text_style')),
            textLeftAttachmentType: objectVal('attach_left'),
            textAngleType: objectVal('text_angle_type'),
            textAlignmentType: objectVal('text_align_type'),
            textRightAttachmentType: objectVal('attach_right'),
            textColor: mleaderColor(objectVal('text_color')),
            textHeight: objectVal('text_height'),
            textFrameEnabled: asBool(objectVal('has_text_frame')),
            textAlignAlwaysLeft: asBool(objectVal('text_always_left')),
            alignSpace: objectVal('align_space'),
            blockContentId: refToId(objectVal('block')),
            blockContentColor: mleaderColor(objectVal('block_color')),
            blockContentScale: objectVal('block_scale'),
            blockContentScaleEnabled: asBool(objectVal('use_block_scale')),
            blockContentRotation: objectVal('block_rotation'),
            blockContentRotationEnabled: asBool(objectVal('use_block_rotation')),
            blockContentConnectionType: objectVal('block_connection'),
            scale: objectVal('scale'),
            overwritePropertyValue: asBool(objectVal('is_changed')),
            annotative: asBool(objectVal('is_annotative')),
            breakGapSize: objectVal('break_size'),
            textAttachmentDirection: objectVal('attach_dir'),
            bottomTextAttachmentDirection: objectVal('attach_bottom'),
            topTextAttachmentDirection: objectVal('attach_top'),
            unknown2: asBool(objectVal('text_extended'))
        };
    }
    convertSpatialFilter(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        const origin = libredwg.dwg_dynapi_entity_data(item, 'origin');
        const numberOfPointsOnClipBoundary = libredwg.dwg_dynapi_entity_data(item, 'num_clip_verts');
        const clip_verts_ptr = libredwg.dwg_dynapi_entity_data(item, 'clip_verts');
        const vertices = libredwg.dwg_ptr_to_point2d_array(clip_verts_ptr, numberOfPointsOnClipBoundary);
        const extrusionDirection = libredwg.dwg_dynapi_entity_data(item, 'extrusion');
        const clipBoundaryVisible = libredwg.dwg_dynapi_entity_data(item, 'display_boundary_on');
        const frontClippingPlaneFlag = libredwg.dwg_dynapi_entity_data(item, 'front_clip_on');
        const frontClippingPlaneDistance = libredwg.dwg_dynapi_entity_data(item, 'front_clip_z');
        const backClippingPlaneFlag = libredwg.dwg_dynapi_entity_data(item, 'back_clip_on');
        const backClippingPlaneDistance = libredwg.dwg_dynapi_entity_data(item, 'back_clip_z');
        const transform_ptr = libredwg.dwg_dynapi_entity_data(item, 'transform');
        const matrix = libredwg.dwg_ptr_to_double_array(transform_ptr, 12);
        const inverse_transform_ptr = libredwg.dwg_dynapi_entity_data(item, 'inverse_transform');
        const invertBlockMatrix = libredwg.dwg_ptr_to_double_array(inverse_transform_ptr, 12);
        return {
            ...commonAttrs,
            origin: origin,
            numberOfPointsOnClipBoundary: numberOfPointsOnClipBoundary,
            vertices: vertices,
            extrusionDirection: extrusionDirection,
            clipBoundaryVisible: !!clipBoundaryVisible,
            frontClippingPlaneFlag: !!frontClippingPlaneFlag,
            frontClippingPlaneDistance: frontClippingPlaneDistance,
            backClippingPlaneFlag: !!backClippingPlaneFlag,
            backClippingPlaneDistance: backClippingPlaneDistance,
            matrix: matrix,
            invertBlockMatrix: invertBlockMatrix
        };
    }
    convertXRecord(item, obj) {
        const libredwg = this.libredwg;
        const commonAttrs = this.getCommonObjectAttrs(obj);
        const cloning = libredwg.dwg_dynapi_entity_data(item, 'cloning');
        const data = libredwg.dwg_object_xrecord_get_xdata(item) ?? [];
        const objectObj = libredwg.dwg_object_get_tio(obj);
        const xdic = objectObj
            ? libredwg.dwg_object_object_get_xdicobjhandle_object(objectObj)
            : null;
        const extensionDictionary = xdic && xdic.absolute_ref
            ? idToString(xdic.absolute_ref)
            : undefined;
        return {
            ...commonAttrs,
            ...(cloning != null ? { cloning } : {}),
            ...(extensionDictionary ? { extensionDictionary } : {}),
            data
        };
    }
    getCommonObjectAttrs(obj) {
        const libredwg = this.libredwg;
        const object_tio = libredwg.dwg_object_get_tio(obj);
        const ownerhandle = libredwg.dwg_object_object_get_ownerhandle_object(object_tio);
        const handle = libredwg.dwg_object_get_handle_object(obj);
        return {
            handle: idToString(handle.value),
            ownerHandle: idToString(ownerhandle.absolute_ref)
        };
    }
}
//# sourceMappingURL=converter.js.map