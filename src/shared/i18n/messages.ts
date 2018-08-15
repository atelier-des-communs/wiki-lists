export interface IMessages {
    add_item: string;
    columns: string;
    edit_item: string;
    cancel: string;
    save: string;
    confirm_delete: string;

    type_boolean : string;
    type_number : string;
    type_enum : string;
    type_text: string;
}

class enMessages implements IMessages {
    add_item = "Add item";
    columns = "Columns";
    edit_item = "Edit item";
    cancel = "Cancel";
    save = "Save";
    confirm_delete = "Are you sure you want to delete this item ?";

    type_boolean = "Yes / no";
    type_number =  "Number";
    type_enum =  "List of options";
    type_text =  "Text";
}

export let _ = new enMessages();