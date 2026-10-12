import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ThreadField from "./ThreadField.jsx";

const html = renderToStaticMarkup(React.createElement(ThreadField));
const count = (re) => (html.match(re) || []).length;
console.log("path:", count(/<path/g));
console.log("ellipse:", count(/<ellipse/g));
console.log("filter:", count(/<filter/g));
console.log("feGaussianBlur:", count(/feGaussianBlur/g));
console.log("mask:", count(/<mask/g));
console.log("linearGradient:", count(/<linearGradient/g));
console.log("radialGradient:", count(/<radialGradient/g));
console.log("animate:", count(/<animate/g));
console.log("url(#tf-neck", count(/url\(#tf-neck/g));
