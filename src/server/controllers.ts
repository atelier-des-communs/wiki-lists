import {HelloWorldController} from "../shared/api";
import {Controller, QueryParams} from "@tsed/common";

@Controller("/rest")
export class HelloWorld extends HelloWorldController {
    async helloWorld(name:string) {
        return "hello " + name;
    }
}