export interface IMessages {
    add_item: string;
    columns: string;
    edit_item: string;
}

class enMessages implements IMessages {
    add_item = "Add item";
    columns = "Columns";
    edit_item = "Edit item";
}

export let _ = new enMessages();