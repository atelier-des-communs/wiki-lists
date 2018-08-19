export class IMessages {

    daadle_title = "Daadle : Instant structured data authoring, for human beings";

    filters = "Filters";

    add_item = "Add item";
    edit_item = "Edit item";
    columns = "Columns";
    cancel = "Cancel";
    save = "Save";
    confirm_delete = "Are you sure you want to delete this item ?";

    type_boolean = "Yes / no";
    type_number =  "Number";
    type_enum =  "List of options";
    type_text =  "Text";

    // Boolean filter
    all =  "all";
    yes = "yes";
    no="no";

    group_by="group by";
    empty_group_by="group by : <none>";

    // Schema dialog
    edit_attributes = "Edit attributes";
    empty = "<empty>";
    add_attribute="Add attribute";
    attribute_name = "Attribute name";
    attribute_type = "Type";
    rich_edit = "Rich edit";
    enum_values = "Options";
    comma_separated= "Comma separated list of options";


    // Schema validation
    attribute_name_mandatory = "Attribute name is mandatory";
    attribute_name_format = "Attribute names should be made of : a-Z, 0-9, _";
    missing_type = "Type is missing";
    missing_enum_values = "Enum values are missing";


    validation_errors = "Validation errors";
    clear_filter = "Clear filter";
    clear_filters = "Clear filters";

    form_error = "You have errors in your form";
    toggle_filters = "Toggle filters sidebar";

    min = "Min"
    max = "Max"

    attribute_details = "details"
}

class enMessages extends IMessages {
}

export let _ = new enMessages();
