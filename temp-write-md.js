function parseMD(raw) {
    if (raw.startsWith('---\n')) {
        const end = raw.indexOf('\n---\n', 4);
        if (end !== -1) {
            try {
                const meta = JSON.parse(raw.slice(4, end));
                const content = raw.slice(end + 5);
                return { meta, content };
            } catch (e) {}
        }
    }
    return { meta: {}, content: raw };
}
function writeMD(meta, contentStr) {
    return `---\n${JSON.stringify(meta, null, 2)}\n---\n${contentStr}`;
}
console.log(parseMD(writeMD({id:"1",title:"hi"}, "hello")));
