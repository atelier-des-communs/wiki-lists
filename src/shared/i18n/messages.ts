import {FlagNameValues} from "semantic-ui-react/dist/commonjs/elements/Flag/Flag";
import {AccessRightsKind} from "../access";

export interface IMessages {
    add_emails: string;

    member_list: string;
    multi_enum: string;
    auth: {
        logout: string;
        profile: string;
        connection_link_sent: string;
        password: string;
        login: string;
        send_connection_link:string;
        userNotFound:string;
        wrongPassword : string;
        bad_login_url: string;
        expired: string;
    };

    selection: string;

    site_title : string;

    filters : string;
    filter : string;

    add_item : string;
    edit_item : string;
    view_item : string;
    delete_item : string;
    columns : string;
    cancel : string;
    save : string;
    confirm_delete : string;

    type_boolean : string;
    type_number : string;
    type_enum : string;
    type_text : string;
    type_datetime : string;

    // Boolean filter
    all : string;
    yes : string;
    no: string;

    group_by: string;
    sort_by: string;
    sort_asc : string;
    sort_desc : string;
    empty_group_by: string;

    // Schema dialog
    edit_attributes : string;
    empty : string;
    add_attribute: string;
    attribute_name : string;
    attribute_type : string;
    rich_edit : string;
    enum_values : string;

    // Schema validation
    attribute_name_mandatory : string;
    attribute_name_format : string;
    missing_type : string;
    duplicate_attribute_name : string;
    missing_enum_values : string;
    empty_enum_value : string;
    missing_attribute: string;

    validation_errors : string;
    clear_filter : string;
    clear_filters : string;

    form_error : string;
    toggle_filters : string;

    min : string;
    max : string;

    attribute_details : string;

    show_attribute : string;
    hide_attribute : string;

    view_type : string;
    table_view : string;
    card_view : string;

    select_columns : string;
    edit_color : string;

    confirm_attribute_delete : string;
    add_option : string;
    option_placeholder : string;
    delete_option : string;
    is_name : string;
    is_mandatory : string;
    is_name_help : string;
    missing_name : string;

    no_element : string;
    unknown_attribute : string;
    mandatory_attribute : string;

    // System attributes
    creation_time_attr : string;
    update_time_attr : string;
    pos_attr : string;
    id_attr : string;
    user_attr: string;


    system_attributes : string;
    not_found : string;
    download : string;
    create_db : string;
    connect_to_create_db: string;
    creating_db : string;
    db_name : string;
    db_description : string;
    db_access: string;
    fields : string;
    name : string;
    description : string ;
    default_schema : string;
    schema_templates: string;
    create_db_name_description : string;
    create_db_fields : string;
    create_db_access : string;
    next : string;
    previous : string;
    finish : string;
    db_url : string;

    //Validators
    should_not_be_empty : string;
    slug_regexp_no_match : string;
    db_not_available : string;
    powered_by : string;

    db_created : string;
    private_link : string;
    public_link : string;
    hide : string;
    back_to_list : string;

    email: string;

    accessType : {
        [K in AccessRightsKind] : string;
    }

    accessTypeExplanation : {
        [K in AccessRightsKind] : string;
    },

    private_db: string;
    error: string;
    admin_panel: string;
}

export interface MessagesProps {
    messages:IMessages;
    lang:string;
}


export interface Language {
    key : string,
    flag : FlagNameValues
}


