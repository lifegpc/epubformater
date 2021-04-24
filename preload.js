const JSZip = require("jszip")
const fs = require("fs")
const { dealWithEPUB } = require("./epub.js");
const { Progress } = require("./log.js");

/**@param {HTMLInputElement} inp
 * @returns {Promise<JSZip>}
*/
function openFile(inp) {
    return new Promise((o, r) => {
        if (!inp.files.length) { r(true); return; }
        let file = input.files[0];
        fs.readFile(file.path, (err, data) => {
            if (err) {
                r(err);
                return;
            }
            let zip = new JSZip();
            zip.loadAsync(data).then(() => {
                o(zip);
            })
        })
    })
}

window.addEventListener('load', () => {
    let inp = document.getElementById('input');
    let o = document.getElementById('open');
    let pi = document.getElementById('progess-info');
    let p = new Progress(pi);
    o.addEventListener('click', () => {
        openFile(inp).then((zip) => {
            dealWithEPUB(zip, p);
        }).catch((err) => {
            if (err === true) {
                p.text = "";
            }
            else {
                console.error(err);
                p.text = err;
            }
        })
    })
})
