'use strict';
const urls=new Set(['https://github.com/ilkehendesi','https://www.instagram.com/thehendesi/','https://x.com/ilkehendesi','https://discord.gg/AMXndmTdKj']);
function allowedExternalURL(url){if(typeof url!=='string'||!urls.has(url))throw Error('This external link is not allowed.');return url;}
module.exports={allowedExternalURL};
