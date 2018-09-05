export class DefaultMessages {

    daadle_title = "Daadle : Online structured data, for human beings.";

    filters = "Filters";
    filter = "filter";

    add_item = "Add item";
    edit_item = "Edit item";
    view_item = "View item";
    delete_item = "Delete item";
    columns = "Columns";
    cancel = "Cancel";
    save = "Save";
    confirm_delete = "Are you sure you want to delete this item ?";

    type_boolean = "Yes / no";
    type_number =  "Number";
    type_enum =  "Options";
    type_text =  "Text";
    type_datetime = "Date & time";

    // Boolean filter
    all =  "all";
    yes = "yes";
    no="no";

    group_by="group by";
    sort_by="sort by";
    sort_asc = "ascending";
    sort_desc = "descending";
    empty_group_by="group by : <none>";

    // Schema dialog
    edit_attributes = "Edit attributes";
    empty = "empty";
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
    duplicate_attribute_name = "Duplicate attribute name";
    missing_enum_values = "You should specify at least two options";
    empty_enum_value = "Option should not by empty";

    validation_errors = "Validation errors";
    clear_filter = "Clear filter";
    clear_filters = "Clear filters";

    form_error = "This form contains errors";
    toggle_filters = "Toggle filters sidebar";

    min = "Min"
    max = "Max"

    attribute_details = "details"

    show_attribute = "show attribute"
    hide_attribute = "hide attribute"

    view_type = "View";
    table_view = "table";
    card_view = "card";

    select_columns = "Attributes visibility";
    edit_color = "Edit color";

    confirm_attribute_delete = "Are you sure you want to delete this attribute ?\nYou will lose data you already entered for it.";
    add_option = "Add option";
    option_placeholder = "Option "
    delete_option = "Delete option"
    is_name = "Part of the name"
    is_mandatory = "Mandatory"
    is_name_help = "Attributes marked as 'name' will be part of the name of each item.\nThere should be at least one attribute marked as a name"
    missing_name = "There should be at least one text field marked as 'name'";

    no_element = "Nothing here";
    unknown_attribute = "Unknown attribute";
    mandatory_attribute = "Attribute is mandatory";

    // System attributes
    creation_time_attr = "Creation time";
    update_time_attr = "Update time";
    pos_attr = "Position";
    id_attr = "Unique ID";


}


export const _ = new DefaultMessages();

