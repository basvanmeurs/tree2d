import { SingleReferenceHandler } from "./SingleReferenceHandler";
import Element from "../../tree/Element";
import Texture from "../../tree/Texture";
import Shader from "../../tree/Shader";
import TextHandler from "./TextHandler";
import ChildrenHandler from "./ChildrenHandler";

const handlers = [
    new SingleReferenceHandler(Element, "texture", Texture, obj => [obj.stage]),
    new SingleReferenceHandler(Element, "shader", Shader, obj => [obj.stage.ctx]),
    new TextHandler(Element, "text"),
    new ChildrenHandler(Element, "children")
];

export default handlers;
