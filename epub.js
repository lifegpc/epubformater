const JSZip = require("jszip");
const { Progress, JSZipProgessFun } = require("./log");

class EPUB {
    constructor(data) {
        this.data = {}
        Object.assign(this.data, data);
    }
    /**@returns {string?}*/
    get container() {
        if (this.hasOwnProperty("_container")) return this._container;
        else return null;
    }
    set container(v) {
        this._container = v;
    }
    get rootfilelist() {
        if (this.hasOwnProperty("_rootfilelist")) return this._rootfilelist;
        else return null;
    }
    set rootfilelist(v) {
        if (Array.isArray(v)) {
            /**@type {Array<string>}*/
            let l = [];
            v.forEach((e) => {
                if (typeof e == "string") l.push(e);
            })
            this._rootfilelist = l.length ? l : null;
        } else if (v == null) {
            this._rootfilelist = null;
        }
    }
}


/**
 * @param {JSZip} zip
 * @param {Progress} p 
 */
async function haveMimeType(zip, p) {
    n = "mimetype";
    if (!zip.files.hasOwnProperty(n)) return false;
    p.text = "Check mimetype file."
    try {
        let s = await zip.files.mimetype.async("string", (m) => {JSZipProgessFun(m, p, n);});
        if (s == "application/epub+zip") return true;
        return false;
    } catch (e) {
        console.warn(e);
        return false;
    }
}

/**
 * @param {JSZip} zip
 * @param {EPUB} epub
 * @param {Progress} p 
 */
async function checkContainer(zip, epub, p) {
    let n = "META-INF/container.xml";
    p.text = "Check container.xml file."
    if (!zip.files.hasOwnProperty(n)) return false;
    try {
        let s = await zip.files[n].async("string", (m) => {JSZipProgessFun(m, p, n)});
        let pa = new DOMParser();
        let d = pa.parseFromString(s, "application/xml");
        let root = d.children[0];
        debugger;
        let l = root.getElementsByTagName('rootfiles');
        if (l.length != 1) return false;
        let rootfiles = l[0];
        /**@type {Array<string>}*/
        let rootfilelist = [];
        for (let i = 0; i < rootfiles.childElementCount; i++) {
            let e = rootfiles.children[i];
            if (e.localName != "rootfile") return false;
            let full_path = e.getAttribute("full-path");
            let media_type = e.getAttribute("media-type");
            if (full_path == null || media_type == null) return false;
            if (media_type != "application/oebps-package+xml") return false;
            if (!zip.files.hasOwnProperty(full_path)) return false;
            rootfilelist.push(full_path);
        }
        epub.container = s;
        epub.rootfilelist = rootfilelist;
        return true;
    }
    catch (e) {
        return false;
    }
}

/**
 * @param {JSZip} zip
 * @param {EPUB} epub
 */
async function checkOPF(zip, epub) {
    let l = epub.rootfilelist;
    if (l == null) return false;
    for (let i = 0; i < l.length; i++) {
        let n = l[i];
        let blob = await zip.files[n].async("blob");
    }
}

/**
 * @param {JSZip} zip
 * @param {EPUB} epub
 * @param {Progress} p
 */
async function isVaildEPUB(zip, epub, p) {
    let hasMimetype = await haveMimeType(zip, p);
    console.log(hasMimetype);
    if (!hasMimetype) return false;
    let ok = await checkContainer(zip, epub, p);
    if (!ok) return false;
    return true;
}

/**
 * @param {JSZip} zip
 * @param {Progress} p
 */
exports.dealWithEPUB = async (zip, p) => {
    let epub = new EPUB();
    let vaild = await isVaildEPUB(zip, epub, p);
    if (!vaild) return false;
}
