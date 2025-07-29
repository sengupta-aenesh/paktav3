All Table Schemas: 
This query will show all tables with their columns, data types, and constraints
[
  {
    "table_schema": "public",
    "table_name": "contract_clauses",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "clause_type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "title",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "content",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "tags",
        "data_type": "ARRAY",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "use_cases",
        "data_type": "ARRAY",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "search_vector",
        "data_type": "tsvector",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "contract_creation_sessions",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "user_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "initial_request",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "detected_type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "collected_parameters",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "conversation_history",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'[]'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "agent_state",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "generated_contract",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "editable_fields",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'[]'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "status",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'in_progress'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "contract_parameters",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "contract_type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "parameter_key",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "parameter_label",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "parameter_type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "is_required",
        "data_type": "boolean",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "true",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "validation_rules",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "help_text",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "example_value",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "options",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "contract_sections",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "template_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "section_type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "title",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "content",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "variables",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'[]'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "order_index",
        "data_type": "integer",
        "character_maximum_length": null,
        "numeric_precision": 32,
        "numeric_scale": 0,
        "is_nullable": "YES",
        "column_default": "0",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "is_optional",
        "data_type": "boolean",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "false",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "conditions",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "search_vector",
        "data_type": "tsvector",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "contract_templates",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "name",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "description",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "category",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "jurisdiction",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'US'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "tags",
        "data_type": "ARRAY",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "search_vector",
        "data_type": "tsvector",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "resolved_risks",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'[]'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "contracts",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "user_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "title",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "content",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "upload_url",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "file_key",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_cache",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "folder_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "creation_session_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_status",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'pending'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_progress",
        "data_type": "integer",
        "character_maximum_length": null,
        "numeric_precision": 32,
        "numeric_scale": 0,
        "is_nullable": "YES",
        "column_default": "0",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "last_analyzed_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_retry_count",
        "data_type": "integer",
        "character_maximum_length": null,
        "numeric_precision": 32,
        "numeric_scale": 0,
        "is_nullable": "YES",
        "column_default": "0",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_error",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "folders",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "user_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "name",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "parent_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "profiles",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "subscription_tier",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "'pro'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "subscription_status",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "'active'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "subscription_start_date",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "subscription_end_date",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "trial_end_date",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "stripe_customer_id",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "stripe_subscription_id",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "monthly_contract_count",
        "data_type": "integer",
        "character_maximum_length": null,
        "numeric_precision": 32,
        "numeric_scale": 0,
        "is_nullable": "YES",
        "column_default": "0",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "last_contract_reset",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "onboarding_completed",
        "data_type": "boolean",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "false",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "now()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "organization_type",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "industry",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "company_size",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "primary_jurisdiction",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'United States'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "additional_jurisdictions",
        "data_type": "ARRAY",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::text[]",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "regulatory_requirements",
        "data_type": "ARRAY",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::text[]",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "risk_tolerance",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'medium'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "has_legal_counsel",
        "data_type": "boolean",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "false",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "legal_context",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "template_folders",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "user_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "name",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "parent_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "template_versions",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "template_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "version_name",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "vendor_name",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "version_data",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "'{}'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "generated_content",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_by",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  },
  {
    "table_schema": "public",
    "table_name": "templates",
    "columns": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "gen_random_uuid()",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "user_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "title",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "content",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "upload_url",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "file_key",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "folder_id",
        "data_type": "uuid",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_cache",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'{}'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_status",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'pending'::text",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_progress",
        "data_type": "integer",
        "character_maximum_length": null,
        "numeric_precision": 32,
        "numeric_scale": 0,
        "is_nullable": "YES",
        "column_default": "0",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "last_analyzed_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_retry_count",
        "data_type": "integer",
        "character_maximum_length": null,
        "numeric_precision": 32,
        "numeric_scale": 0,
        "is_nullable": "YES",
        "column_default": "0",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "analysis_error",
        "data_type": "text",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": null,
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "resolved_risks",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'[]'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "NO",
        "column_default": "timezone('utc'::text, now())",
        "is_identity": "NO",
        "identity_generation": null
      },
      {
        "column_name": "user_created_variables",
        "data_type": "jsonb",
        "character_maximum_length": null,
        "numeric_precision": null,
        "numeric_scale": null,
        "is_nullable": "YES",
        "column_default": "'[]'::jsonb",
        "is_identity": "NO",
        "identity_generation": null
      }
    ]
  }
]
-- 2. EXTRACT ALL INDEXES
[
  {
    "schemaname": "public",
    "tablename": "contract_clauses",
    "indexname": "contract_clauses_pkey",
    "indexdef": "CREATE UNIQUE INDEX contract_clauses_pkey ON public.contract_clauses USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_clauses",
    "indexname": "idx_contract_clauses_tags",
    "indexdef": "CREATE INDEX idx_contract_clauses_tags ON public.contract_clauses USING gin (tags)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_clauses",
    "indexname": "idx_contract_clauses_type",
    "indexdef": "CREATE INDEX idx_contract_clauses_type ON public.contract_clauses USING btree (clause_type)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_creation_sessions",
    "indexname": "contract_creation_sessions_pkey",
    "indexdef": "CREATE UNIQUE INDEX contract_creation_sessions_pkey ON public.contract_creation_sessions USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_parameters",
    "indexname": "contract_parameters_pkey",
    "indexdef": "CREATE UNIQUE INDEX contract_parameters_pkey ON public.contract_parameters USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_sections",
    "indexname": "contract_sections_pkey",
    "indexdef": "CREATE UNIQUE INDEX contract_sections_pkey ON public.contract_sections USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_sections",
    "indexname": "idx_contract_sections_template",
    "indexdef": "CREATE INDEX idx_contract_sections_template ON public.contract_sections USING btree (template_id)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_templates",
    "indexname": "contract_templates_pkey",
    "indexdef": "CREATE UNIQUE INDEX contract_templates_pkey ON public.contract_templates USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_templates",
    "indexname": "idx_contract_templates_resolved_risks",
    "indexdef": "CREATE INDEX idx_contract_templates_resolved_risks ON public.contract_templates USING gin (resolved_risks)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_templates",
    "indexname": "idx_contract_templates_tags",
    "indexdef": "CREATE INDEX idx_contract_templates_tags ON public.contract_templates USING gin (tags)"
  },
  {
    "schemaname": "public",
    "tablename": "contract_templates",
    "indexname": "idx_contract_templates_type",
    "indexdef": "CREATE INDEX idx_contract_templates_type ON public.contract_templates USING btree (type)"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "indexname": "contracts_folder_id_idx",
    "indexdef": "CREATE INDEX contracts_folder_id_idx ON public.contracts USING btree (folder_id)"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "indexname": "contracts_pkey",
    "indexdef": "CREATE UNIQUE INDEX contracts_pkey ON public.contracts USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "indexname": "idx_contracts_analysis_status",
    "indexdef": "CREATE INDEX idx_contracts_analysis_status ON public.contracts USING btree (analysis_status)"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "indexname": "idx_contracts_created_at",
    "indexdef": "CREATE INDEX idx_contracts_created_at ON public.contracts USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "indexname": "idx_contracts_last_analyzed",
    "indexdef": "CREATE INDEX idx_contracts_last_analyzed ON public.contracts USING btree (last_analyzed_at)"
  },
  {
    "schemaname": "public",
    "tablename": "contracts",
    "indexname": "idx_contracts_user_id",
    "indexdef": "CREATE INDEX idx_contracts_user_id ON public.contracts USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "folders",
    "indexname": "folders_parent_id_idx",
    "indexdef": "CREATE INDEX folders_parent_id_idx ON public.folders USING btree (parent_id)"
  },
  {
    "schemaname": "public",
    "tablename": "folders",
    "indexname": "folders_pkey",
    "indexdef": "CREATE UNIQUE INDEX folders_pkey ON public.folders USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "folders",
    "indexname": "folders_user_id_idx",
    "indexdef": "CREATE INDEX folders_user_id_idx ON public.folders USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_stripe_customer_id_key",
    "indexdef": "CREATE UNIQUE INDEX profiles_stripe_customer_id_key ON public.profiles USING btree (stripe_customer_id)"
  },
  {
    "schemaname": "public",
    "tablename": "template_folders",
    "indexname": "template_folders_parent_id_idx",
    "indexdef": "CREATE INDEX template_folders_parent_id_idx ON public.template_folders USING btree (parent_id)"
  },
  {
    "schemaname": "public",
    "tablename": "template_folders",
    "indexname": "template_folders_pkey",
    "indexdef": "CREATE UNIQUE INDEX template_folders_pkey ON public.template_folders USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "template_folders",
    "indexname": "template_folders_user_id_idx",
    "indexdef": "CREATE INDEX template_folders_user_id_idx ON public.template_folders USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "template_versions",
    "indexname": "template_versions_created_by_idx",
    "indexdef": "CREATE INDEX template_versions_created_by_idx ON public.template_versions USING btree (created_by)"
  },
  {
    "schemaname": "public",
    "tablename": "template_versions",
    "indexname": "template_versions_pkey",
    "indexdef": "CREATE UNIQUE INDEX template_versions_pkey ON public.template_versions USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "template_versions",
    "indexname": "template_versions_template_id_idx",
    "indexdef": "CREATE INDEX template_versions_template_id_idx ON public.template_versions USING btree (template_id)"
  },
  {
    "schemaname": "public",
    "tablename": "templates",
    "indexname": "templates_analysis_status_idx",
    "indexdef": "CREATE INDEX templates_analysis_status_idx ON public.templates USING btree (analysis_status)"
  },
  {
    "schemaname": "public",
    "tablename": "templates",
    "indexname": "templates_folder_id_idx",
    "indexdef": "CREATE INDEX templates_folder_id_idx ON public.templates USING btree (folder_id)"
  },
  {
    "schemaname": "public",
    "tablename": "templates",
    "indexname": "templates_pkey",
    "indexdef": "CREATE UNIQUE INDEX templates_pkey ON public.templates USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "templates",
    "indexname": "templates_user_id_idx",
    "indexdef": "CREATE INDEX templates_user_id_idx ON public.templates USING btree (user_id)"
  }
]
- 3. EXTRACT ALL FOREIGN KEY CONSTRAINTS
[
  {
    "table_schema": "public",
    "constraint_name": "template_folders_parent_id_fkey",
    "table_name": "template_folders",
    "column_name": "parent_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "template_folders",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "table_schema": "public",
    "constraint_name": "templates_folder_id_fkey",
    "table_name": "templates",
    "column_name": "folder_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "template_folders",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "SET NULL"
  },
  {
    "table_schema": "public",
    "constraint_name": "template_versions_template_id_fkey",
    "table_name": "template_versions",
    "column_name": "template_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "templates",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "table_schema": "public",
    "constraint_name": "contracts_folder_id_fkey",
    "table_name": "contracts",
    "column_name": "folder_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "folders",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "SET NULL"
  },
  {
    "table_schema": "public",
    "constraint_name": "contract_sections_template_id_fkey",
    "table_name": "contract_sections",
    "column_name": "template_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "contract_templates",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "table_schema": "public",
    "constraint_name": "folders_parent_id_fkey",
    "table_name": "folders",
    "column_name": "parent_id",
    "foreign_table_schema": "public",
    "foreign_table_name": "folders",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  }
]
-- 4. EXTRACT ALL PRIMARY KEY CONSTRAINTS
[
  {
    "table_schema": "public",
    "table_name": "contract_clauses",
    "constraint_name": "contract_clauses_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "contract_creation_sessions",
    "constraint_name": "contract_creation_sessions_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "contract_parameters",
    "constraint_name": "contract_parameters_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "contract_sections",
    "constraint_name": "contract_sections_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "contract_templates",
    "constraint_name": "contract_templates_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "contracts",
    "constraint_name": "contracts_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "folders",
    "constraint_name": "folders_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "profiles",
    "constraint_name": "profiles_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "template_folders",
    "constraint_name": "template_folders_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "template_versions",
    "constraint_name": "template_versions_pkey",
    "key_columns": "id"
  },
  {
    "table_schema": "public",
    "table_name": "templates",
    "constraint_name": "templates_pkey",
    "key_columns": "id"
  }
]
-- 5. EXTRACT ALL UNIQUE CONSTRAINTS
Success. No rows returned
-- 6. EXTRACT ALL CHECK CONSTRAINTS
Success. No rows returned
-- 7. EXTRACT ALL RLS POLICIES
Success. No rows returned
-- 8. EXTRACT ALL FUNCTIONS
[
  {
    "schema_name": "public",
    "function_name": "handle_new_user",
    "arguments": "",
    "return_type": "trigger",
    "function_body": "\r\nBEGIN\r\n    INSERT INTO public.profiles (id, subscription_tier, subscription_status)\r\n    VALUES (new.id, 'pro', 'active');\r\n    RETURN new;\r\nEND;\r\n",
    "language": "plpgsql",
    "volatility": "VOLATILE",
    "is_strict": false,
    "security_definer": true
  },
  {
    "schema_name": "public",
    "function_name": "handle_updated_at",
    "arguments": "",
    "return_type": "trigger",
    "function_body": "\r\n  BEGIN\r\n      NEW.updated_at = timezone('utc'::text, now());\r\n      RETURN NEW;\r\n  END;\r\n  ",
    "language": "plpgsql",
    "volatility": "VOLATILE",
    "is_strict": false,
    "security_definer": false
  },
  {
    "schema_name": "public",
    "function_name": "update_clauses_search_vector",
    "arguments": "",
    "return_type": "trigger",
    "function_body": "\r\nBEGIN\r\n  NEW.search_vector := to_tsvector('english', \r\n    COALESCE(NEW.title, '') || ' ' || \r\n    COALESCE(NEW.content, '') || ' ' ||\r\n    COALESCE(array_to_string(NEW.tags, ' '), '')\r\n  );\r\n  RETURN NEW;\r\nEND;\r\n",
    "language": "plpgsql",
    "volatility": "VOLATILE",
    "is_strict": false,
    "security_definer": false
  },
  {
    "schema_name": "public",
    "function_name": "update_sections_search_vector",
    "arguments": "",
    "return_type": "trigger",
    "function_body": "\r\nBEGIN\r\n  NEW.search_vector := to_tsvector('english', \r\n    COALESCE(NEW.title, '') || ' ' || \r\n    COALESCE(NEW.content, '')\r\n  );\r\n  RETURN NEW;\r\nEND;\r\n",
    "language": "plpgsql",
    "volatility": "VOLATILE",
    "is_strict": false,
    "security_definer": false
  },
  {
    "schema_name": "public",
    "function_name": "update_templates_search_vector",
    "arguments": "",
    "return_type": "trigger",
    "function_body": "\r\nBEGIN\r\n  NEW.search_vector := to_tsvector('english', \r\n    COALESCE(NEW.name, '') || ' ' || \r\n    COALESCE(NEW.description, '') || ' ' ||\r\n    COALESCE(array_to_string(NEW.tags, ' '), '')\r\n  );\r\n  RETURN NEW;\r\nEND;\r\n",
    "language": "plpgsql",
    "volatility": "VOLATILE",
    "is_strict": false,
    "security_definer": false
  },
  {
    "schema_name": "public",
    "function_name": "update_updated_at_column",
    "arguments": "",
    "return_type": "trigger",
    "function_body": "\r\nBEGIN\r\n  NEW.updated_at = NOW();\r\n  RETURN NEW;\r\nEND;\r\n",
    "language": "plpgsql",
    "volatility": "VOLATILE",
    "is_strict": false,
    "security_definer": false
  }
]
-- Corrected query to extract triggers
Success. No rows returned
-- 10. EXTRACT ALL VIEWS
Success. No rows returned
-- 11. EXTRACT ALL SEQUENCES
Success. No rows returned
-- 12. EXTRACT TABLE ROW SECURITY STATUS
Success. No rows returned
-- 13. EXTRACT ALL ENUMS/CUSTOM TYPES
Success. No rows returned
-- 14. EXTRACT DATABASE EXTENSIONS
[
  {
    "extension_name": "pg_graphql",
    "version": "1.5.11"
  },
  {
    "extension_name": "pg_stat_statements",
    "version": "1.10"
  },
  {
    "extension_name": "pgcrypto",
    "version": "1.3"
  },
  {
    "extension_name": "supabase_vault",
    "version": "0.3.1"
  },
  {
    "extension_name": "uuid-ossp",
    "version": "1.1"
  }
]
-- 15. EXTRACT REALTIME PUBLICATION SETTINGS (if any)
Success. No rows returned