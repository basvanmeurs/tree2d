import { SingleReferenceHandler } from "./SingleReferenceHandler";
import Element from "../../tree/Element";
import Texture from "../../tree/Texture";
import Shader from "../../tree/Shader";
import TextHandler from "./TextHandler";
import ChildrenHandler from "./ChildrenHandler";
import { ShaderHandler } from "./ShaderHandler";

const handlers = [
    new SingleReferenceHandler(Element, "texture", Texture, obj => [obj.stage]),
    new ShaderHandler(Element, "shader"),
    new TextHandler(Element, "text"),
    new ChildrenHandler(Element, "children")
];

export default handlers;
