const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-model");

const nlp = winkNLP(model);
const its = nlp.its;

// Extract keywords from user message
export function extractKeywords(text) {
    const doc = nlp.readDoc(text);
    return doc.tokens()
        .filter(t => t.out(its.type) === "word")
        .out(its.normal)
        .slice(0, 8); // limit keywords
}
