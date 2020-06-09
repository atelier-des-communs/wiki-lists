import {IMessages} from "../../shared/i18n/messages";

export let messages : IMessages = {

    email: "Email",

    site_title : "Données structurées, pour des humains.",

    filters : "Filtres",
    filter : "Filtre",

    add_item : "Ajouter un élement",
    edit_item : "Éditer",
    view_item : "Voir",
    delete_item : "Supprimer",
    columns : "Collones",
    cancel : "Annuler",
    save : "Enregistrer",
    confirm_delete : "Êtes vous sûr de vouloir supprimer cet élément ?",

    type_boolean : "Oui / non",
    type_number :  "Nombre",
    type_enum :  "Choix multiple",
    type_text :  "Texte",
    type_datetime : "Date & heure",

    // Boolean filter
    all : "tout",
    yes : "oui",
    no: "non",

    group_by:"grouper par",
    sort_by:"trier par",
    sort_asc : "croissant",
    sort_desc : "décroissant",
    empty_group_by: "grouper par : <aucun>",

    // Schema dialog
    edit_attributes : "Editer les attributs",
    empty : "vide",
    add_attribute:"Ajouter un attribut",
    attribute_name : "Nom de l'attribut",
    attribute_type : "Type",
    rich_edit : "Texte formatté",
    enum_values : "Options",



    // Schema validation
    missing_attribute: "Attribut manquant",
    attribute_name_mandatory : "Le nom d'attribut est requis",
    attribute_name_format : "Les noms d'attribut doivent être composés de : a-Z, 0-9, _",
    missing_type : "Type manquant",
    duplicate_attribute_name : "Nom d'attribut dupliqué",
    missing_enum_values : "Vous devez proposer au moins deux options",
    empty_enum_value : "Une option ne doit pas être vide",

    validation_errors : "Erreurs de validation",
    clear_filter : "annuler le filtre",
    clear_filters : "annuler les filters",

    form_error : "Ce formulaire contient des erreurs",
    toggle_filters : "Basculer la barre latérale de filtres",

    min : "Min",
    max : "Max",

    attribute_details : "détails",

    show_attribute : "Afficher l'attribut",
    hide_attribute : "Cacher l'attribut",

    selection: "Sélection",
    view_type : "Vue",
    table_view : "tableau",
    card_view : "grille",

    select_columns : "Attributs",
    edit_color : "Modifier la couleur",

    confirm_attribute_delete : "Êtes vous sûr de vouloir supprimer cet attribut ?\nVous allez perdre les données déjà entrées.",
    add_option : "Ajouter une option",
    option_placeholder : "Option ",
    delete_option : "Supprimer l'option",
    is_name : "Composante du nom",
    is_mandatory : "Obligatoire",
    is_name_help : "Les attributs marqués comme 'nom' feront partie du nom de chaque élément.\nIl doit y avoir au moins un attribut marqué comme nom",
    missing_name : "Il devrait y avoir au moins un champ texte marqué comme 'nom'",

    no_element : "Aucun élement trouvé",
    unknown_attribute : "Attribut inconnu",
    mandatory_attribute : "Attribut obligatoire",

    // System attributes
    creation_time_attr : "Heure de création",
    update_time_attr : "Heure de modification",
    pos_attr : "Position",
    id_attr : "Identifiant",
    user_attr : "Auteur",
    system_attributes : "Attributs système",
    not_found : "Rien ici",
    download: "Télécharger les données",
    create_db : "Créer une collection",
    connect_to_create_db : "Connectez vous pour créer une collection",
    creating_db : "Nouvelle collection",
    db_name : "Nom de la collection",
    db_description : "Description",
    db_access : "Droits d'accès",
    fields : "Attributs",


    // Create DB
    name : "Nom",
    description : "Description",
    default_schema : "Basique",
    schema_templates:  "Modèles de champs",
    create_db_name_description : "Nom et description",
    create_db_fields : "Champs",
    create_db_access : "Accès",
    next : "Suivant",
    previous : "Précédent",
    finish : "Terminer",
    db_url : "Lien",

    // Validators
    should_not_be_empty : "Ne doit pas être vide",
    slug_regexp_no_match: "Doit être composé uniquement de 0-9 a-z '-' et '_'",
    db_not_available : "Ce nom est déjà pris",

    powered_by : "propulsé par",

    db_created : "Collection créée",
    private_link : "Lien d'administration. À conserver. Ne le partagez pas !",
    public_link : "Lien public : à partager",

    hide : "Cacher",
    back_to_list : "Retour à la liste",

    auth: {
        password :"Mot de passe",
        login: "Se connecter",
        userNotFound : "Email non trouvé",
        wrongPassword : "Mot de passe incorrect",
        expired : "Le lien de connection est expiré",
        bad_login_url : "Lien de connection invalide",
        send_connection_link : "Envoyez moi un lien de connection",
        connection_link_sent : "Un lien de connection vient d'être envoyé à  %EMAIL%. Vérifiez vos emails (ainsi que vos spams)",
        profile : "compte",
        logout : "se déconnecter"
    },

    accessType: {
        "collaborative" :  "Collaboratif",
        "wiki" :  "Wiki",
        "read_only" :  "Lecture seule"},

    accessTypeExplanation : {
        "collaborative" : "Les utilisateurs connectés peuvent ajouter du contenu et éditer leurs propres ajouts",
        "wiki" : "Tout le monde peut consulter ajouter et éditer tout contenu",
        "read_only" : "Seuls les administrateurs peuvent ajouter et éditer du contenu"
    },

    private_db : "Vous n'avez pas accès à cette resource. Vous devez être un membre connecté.",
    error: "Une erreur est survenue",
    multi_enum : "Choix multiple",
    member_list : "Liste des membres",
    admin_panel : "Admin",
    add_emails : "Ajouter des emails"
};

// Make messages globally available (this file is imported directly)
(window as any).__MESSAGES__ = messages;
