const JSZip = require("jszip");
const { Progress, JSZipProgessFun } = require("./log");

class EPUBManifest {
    constructor(uniqueIdentifier, version, s, d) {
        if (uniqueIdentifier == undefined || version == undefined) {
            throw Error("unique-identifier or version is needed in manifest file.");
        }
        if (typeof uniqueIdentifier != "string") {
            throw Error("unique-identifier must be string.")
        }
        if (version != "2.0" && version != "3.0") {
            throw Error("version must be 2.0 or 3.0.")
        }
        if (typeof s != "string" || !s.length) {
            throw Error('s must have content.')
        }
        if (d.constructor != Document && d.constructor != XMLDocument) {
            throw Error("")
        }
        this.data = {}
        this.data["unique-identifier"] = uniqueIdentifier;
        this.data["version"] = version;
        this.data["s"] = s;
        this.data["doc"] = d;
    }
    /**@returns {Document}*/
    get doc() {
        return this.data["doc"];
    }
    get manifest() {
        /**@type {Array<Element>}*/
        let l = [];
        let r = this.root;
        for (let i = 0; i < r.childElementCount; i++) {
            let e = r.children[i];
            if (e.localName == "manifest") {
                l.push(e);
            }
        }
        return l.length == 1 ? l[0] : null;
    }
    get metadata() {
        /**@type {Array<Element>}*/
        let l = [];
        let r = this.root;
        for (let i = 0; i < r.childElementCount; i++) {
            let e = r.children[i];
            if (e.localName == "metadata") {
                l.push(e);
            }
        }
        return l.length == 1 ? l[0] : null;
    }
    /**@returns {string}*/
    get origin() {
        return this.data["s"];
    }
    get root() {
        return this.doc.children[0];
    }
    get spine() {
        /**@type {Array<Element>}*/
        let l = [];
        let r = this.root;
        for (let i = 0; i < r.childElementCount; i++) {
            let e = r.children[i];
            if (e.localName == "spine") {
                l.push(e);
            }
        }
        return l.length == 1 ? l[0] : null;
    }
    /**@returns {string}*/
    get uniqueIdentifier() {
        return this.data["unique-identifier"]
    }
    /**@returns {"2.0"|"3.0"} */
    get version() {
        return this.data["version"];
    }
}

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
    if (!zip.files.hasOwnProperty(n)) {
        p.text = "Can not find mimetype file."
        return false;
    }
    p.text = "Check mimetype file."
    try {
        let s = await zip.files.mimetype.async("string", (m) => { JSZipProgessFun(m, p, n); });
        if (s == "application/epub+zip") return true;
        p.text = 'The content of mimetype must be "application/epub+zip".'
        return false;
    } catch (e) {
        console.warn(e);
        p.text = e;
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
        let s = await zip.files[n].async("string", (m) => { JSZipProgessFun(m, p, n) });
        let pa = new DOMParser();
        let d = pa.parseFromString(s, "application/xml");
        let root = d.children[0];
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
        console.warn(e);
        return false;
    }
}

/**
 * @param {JSZip} zip
 * @param {EPUB} epub
 * @param {Progress} p
 */
async function checkOPF(zip, epub, p) {
    let l = epub.rootfilelist;
    if (l == null) {
        p.text = "Can not find package file."
        return false;
    }
    try {
        for (let i = 0; i < l.length; i++) {
            let n = l[i];
            let s = await zip.files[n].async("string", (m) => { JSZipProgessFun(m, p, n) });
            let pa = new DOMParser();
            let d = pa.parseFromString(s, "application/xml");
            let root = d.children[0];
            debugger;
            if (root.localName != "package") return false;
            let version = root.getAttribute("version");
            if (version == null) {
                p.text = "Version is needed in package."
                return false;
            }
            if (version != "3.0" && version != "2.0") {
                p.text = "Now only support EPUB 2.0/3.0."
                return false;
            }
            let uniqueIdentifier = root.getAttribute("unique-identifier");
            if (uniqueIdentifier == null || !uniqueIdentifier.length) {
                p.text = "unique-identifier is needed in package."
                return false;
            }
            let m = new EPUBManifest(uniqueIdentifier, version, s, d);
            if (m.metadata == null) {
                p.text = "1 metadata is needed in package."
                return false;
            }
            if (m.manifest == null) {
                p.text = "1 manifest is needed in package."
                return false;
            }
            if (m.spine == null) {
                p.text = "1 spine is needed in package."
                return false;
            }
        }
        return true;
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
async function isVaildEPUB(zip, epub, p) {
    let hasMimetype = await haveMimeType(zip, p);
    console.log(hasMimetype);
    if (!hasMimetype) return false;
    let ok = await checkContainer(zip, epub, p);
    if (!ok) return false;
    ok = await checkOPF(zip, epub, p);
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
