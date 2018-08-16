import { Component } from "react";

declare module "react-rte/lib/RichTextEditor" {
    interface IProps {
        className?: string;
        toolbarClassName?: string;
        editorClassName?: string;
        value: EditorValue;
        onChange?: ChangeHandler;
        placeholder?: string;
        customStyleMap?: { [style: string]: { [key: string]: any } };
        handleReturn?: (event: Object) => boolean;
        customControls?: Array<CustomControl>;
        readOnly?: boolean;
        disabled?: boolean; // Alias of readOnly
        toolbarConfig?: ToolbarConfig;
        blockStyleFn?: (block: ContentBlock) => string | undefined;
        autoFocus?: boolean;
        keyBindingFn?: (event: Object) => string | undefined;
        rootStyle?: Object;
        editorStyle?: Object;
        toolbarStyle?: Object;
    }

    export default class RichTextEditor extends Component<IProps, any> {

    }
}