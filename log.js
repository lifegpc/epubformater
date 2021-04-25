class Progress {
    /**@param {HTMLElement} ele*/
    constructor(ele) {
        if (ele == null) throw Error("ele is needed.")
        this.ele = ele;
    }
    get text() {
        return this.ele.innerText;
    }
    /**@param {any} v*/
    set text(v) {
        if (typeof v == "string") this.ele.innerText = v;
        else if (v == null) this.ele.innerText = "";
        else if (v.constructor == Error) {
            if (v.stack != null) this.ele.innerText = v.stack;
            else this.ele.innerText = v.name + ": " + v.message;
        }
        else {
            let s = "";
            try {
                s = "" + v;
            } catch (e) { }
            this.ele.innerText = s;
        }
    }
    get HTML() {
        return this.ele.innerHTML;
    }
    /**@param {any} v*/
    set HTML(v) {
        if (typeof v == "string") this.ele.innerHTML = v;
        else if (v == null) this.ele.innerHTML = "";
        else if (v.constructor == Error) {
            if (v.stack != null) this.ele.innerText = v.stack;
            else this.ele.innerText = v.name + ": " + v.message;
        }
        else {
            let s = "";
            try {
                s = "" + v;
            } catch (e) { }
            this.ele.innerHTML = s;
        }
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
