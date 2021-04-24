class Progress {
    /**@param {HTMLElement} ele*/
    constructor(ele) {
        if (ele == null) throw Error("ele is needed.")
        this.ele = ele;
    }
    get text() {
        return this.ele.innerText;
    }
    set text(v) {
        if (typeof v == "string") this.ele.innerText = v;
        else if (v == null) this.ele.innerText = "";
    }
    get HTML() {
        return this.ele.innerHTML;
    }
    set HTML(v) {
        if (typeof v == "string") this.ele.innerHTML = v;
        else if (v == null) this.ele.innerHTML = "";
    }
}

/**
 * @param {string} s
 */
function q(s) {
    return '"' + s + '"';
}

exports.Progress = Progress;
/**
 * @param {{percent: number;currentFile: string?;}} m
 * @param {Progress} p
 * @param {string?} fn
 */
exports.JSZipProgessFun = (m, p, fn) => {
    p.text = 'Uncompress file ' + (m.hasOwnProperty("currentFile") ? q(m.currentFile) : fn != null ? q(fn) : "Unknown") + ' :' + m.percent + '%';
}
