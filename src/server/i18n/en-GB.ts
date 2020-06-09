import {IMessages} from "../../shared/i18n/messages";

export let messages : IMessages = {
    email: "Email",

    site_title : "Structured data, for human beings.",

    filters : "Filters",
    filter : "Filter",

    add_item : "Add item",
    edit_item : "Edit item",
    view_item : "View item",
    delete_item : "Delete item",
    columns : "Columns",
    cancel : "Cancel",
    save : "Save",
    confirm_delete : "Are you sure you want to delete this item ?",

    type_boolean : "Yes / no",
    type_number :  "Number",
    type_enum :  "Options",
    type_text :  "Text",
    type_datetime : "Date & time",

    // Boolean filter
    all :  "all",
    yes : "yes",
    no:"no",

    group_by:"group by",
    sort_by:"sort by",
    sort_asc : "ascending",
    sort_desc : "descending",
    empty_group_by:"group by : <none>",

    // Schema dialog
    edit_attributes : "Edit attributes",
    empty : "empty",
    add_attribute:"Add attribute",
    attribute_name : "Attribute name",
    attribute_type : "Type",
    rich_edit : "Rich edit",
    enum_values : "Options",

    // Schema validation
    missing_attribute: "Attribute is missing",
    attribute_name_mandatory : "Attribute name is mandatory",
    attribute_name_format : "Attribute names should be made of : a-Z, 0-9, _",
    missing_type : "Type is missing",
    duplicate_attribute_name : "Duplicate attribute name",
    missing_enum_values : "You should specify at least two options",
    empty_enum_value : "Option should not by empty",

    validation_errors : "Validation errors",
    clear_filter : "Clear filter",
    clear_filters : "Clear filters",

    form_error : "This form contains errors",
    toggle_filters : "Toggle filters sidebar",

    min : "Min",
    max : "Max",

    attribute_details : "details",

    show_attribute : "show attribute",
    hide_attribute : "hide attribute",

    selection: "Selection",
    view_type : "View",
    table_view : "table",
    card_view : "card",

    select_columns : "Attributes",
    edit_color : "Edit color",

    confirm_attribute_delete : "Are you sure you want to delete this attribute ?\nYou will lose data you already entered for it.",
    add_option : "Add option",
    option_placeholder : "Option ",
    delete_option : "Delete option",
    is_name : "Part of the name",
    is_mandatory : "Mandatory",
    is_name_help : "Attributes marked as 'name' will be part of the name of each item.\nThere should be at least one attribute marked as a name",
    missing_name : "There should be at least one text field marked as 'name'",

    no_element : "Nothing here",
    unknown_attribute : "Unknown attribute",
    mandatory_attribute : "Attribute is mandatory",

    // System attributes
    creation_time_attr : "Creation time",
    update_time_attr : "Update time",
    pos_attr : "Position",
    id_attr : "Unique ID",
    user_attr: "Auteur",

    system_attributes : "System attributes",
    not_found : "Nothing found here",
    download : "Download data",
    create_db : "Create new collection",
    connect_to_create_db : "Login before creating a new collection",
    creating_db : "New collection",
    db_name : "Name of the collection",
    db_description : "Description",
    db_access :  "Access rights",
    fields : "Attributes",
    name : "Name",
    description : "Description" ,
    default_schema : "Basic",
    schema_templates:  "Templates of fields",
    create_db_name_description : "Name and description",
    create_db_fields : "Fields",
    create_db_access : "Access",
    next : "Next",
    previous : "Previous",
    finish : "Finish",
    db_url : "Link",

    //Validators
    should_not_be_empty : "Should not be empty",
    slug_regexp_no_match : "Slug should only be composed of 0-9, a-z, '-' and '_' ",
    db_not_available : "Name is already taken",
    powered_by : "powered by",

    db_created : "Collection successfully created",
    private_link : "Admin link : save it, don't share it !",
    public_link : "Public link : share it with contributors",
    hide : "Hide",
    back_to_list :  "Back to the list",

    auth: {
        password: "Password",
        login: "Login",
        userNotFound : "User not found",
        wrongPassword : "Wrong password",
        expired : "Connexion link has expired",
        bad_login_url : "Connexion link is invalid",
        send_connection_link : "Send me a connection link",
        connection_link_sent : "A connection link has just been sent to %EMAIL%. Please check your emails (including spams)",
        logout : "Logout",
        profile : "Compte"
    },

    accessType: {
        "collaborative" :  "Collaborative",
        "wiki" :  "Wiki",
        "read_only" :  "Read only"},

    accessTypeExplanation : {
        "collaborative" : "Connected users can add content and edit their own content",
        "wiki" : "Anyone can add a edit any content",
        "read_only" : "Only admins can add and edit content"
    },

    private_db : "You don't have access to this resource. You should be a connected member to view it",
    error: "An error happened",
    multi_enum : "Multiple choice",
    member_list : "List of members",
    admin_panel : "Admin panel",

    add_emails : "Add emails"

};

// Make messages globally available (this file is imported directly)
if (typeof window !== "undefined") {
    (window as any).__MESSAGES__ = messages;
}