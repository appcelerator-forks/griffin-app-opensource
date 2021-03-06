// eslint-disable-next-line no-global-assign
Promise = require(`bluebird`);

const _ = require(`lodash`);
const path = require(`path`);

/***********************************
 * Initialize API Builder
 ***********************************/
const ApiBuilder = require(`@axway/api-builder-runtime`);
const { app } = ApiBuilder.getGlobal();

/***********************************
 * Initialize Logging
 ***********************************/
const filename = __filename.substring(path.join(__dirname, `..`).length);
const logger = new app.locals.Logger({ filename });
logger.trace(`module initialization: ${filename}`);


/***********************************
 * Initialize Managers
 ***********************************/
const ApiManager = require(`../../lib/ApiManager`);
const ErrorManager = require(`../../lib/ErrorManager`);
const OperationManager = require(`../../lib/OperationManager`);

/***********************************
 * Initialize Instances
 ***********************************/
const api = new ApiManager();

/***********************************
 * Configure API
 ***********************************/

const operationMetadata = {
	group:       `offices`,
	name:        `put-office`,
	path:        `/api/v1/offices/:office_id`,
	method:      `PUT`,
	description: `Upserts a office based on the ID supplied.  Will replace office, if it already exists otherwise it will insert a new office.`,
	parameters:  {
		office_id:         { description: `ID of the office to update`, type: `query`, optional: false  },
		id:                { description: `Unique ID for this entity (across environments)`, type: `body`, optional: true  },
		name:              { description: `Name of office`, type: `body`, optional: false  },
		description:       { description: `Description of office`, type: `body`, optional: true  },
		timezone:          { description: `Timezone where this office is located`, type: `body`, optional: false  },
		address:           { description: `Address (line 1) of office location`, type: `body`, optional: true  },
		address2:          { description: `Address (line 2) of office location`, type: `body`, optional: true  },
		city:              { description: `City where office is located`, type: `body`, optional: true  },
		state:             { description: `State where office is located`, type: `body`, optional: true  },
		country:           { description: `Country where office is located`, type: `body`, optional: true  },
		max_capacity:      { description: `Maximum capacity for this office`, type: `body`, optional: false  },
		location:          { description: `Geocoordinates of this office`, type: `body`, optional: true  },
		allow_checkins:    { description: `Does this office allow check-ins`, type: `body`, optional: true  },
		notice_sources:    { description: `Meta for the sources of notices for this office`, type: `body`, optional: true  },
		object_created_at: { description: `Autogenerated timestamp when DB field created`, type: `body`, optional: true  },
		object_updated_at: { description: `Autogenerated timestamp when DB field updated`, type: `body`, optional: true  },
		entity_created_at: { description: `entity_created_at`, type: `body`, optional: true  },
		entity_updated_at: { description: `entity_updated_at`, type: `body`, optional: true  },
		object_id:         { description: `Autogenerated Object ID for this entity`, type: `body`, optional: true  },
		tags:              { description: `Tags associated with entity`, type: `body`, optional: true  },
		postalcode:        { description: `Postal code for office location`, type: `body`, optional: true  },
	},
	scopes:             [ `write:offices` ],
	modelName:          `Office`,
	actionName:         `upsert-one`,
	wildcardParameters: true,
};

module.exports = ApiBuilder.API.extend(
	Object.assign(operationMetadata, {
		async action (req, resp, next) {
			console.error(`******************************************************************************`);
			logger.entering(`operation: ${operationMetadata.name}`);

			try {

				const operationManager = new OperationManager({
					operationId: operationMetadata.operationId,
					metadata:    operationMetadata,
					logger,
					request:     req,
					response:    resp,
					next,
					api,
				});

				await operationManager.validateRequest();

				const { office_id, name, description, timezone, address, address2, city, state, country, max_capacity, location, allow_checkins, notice_sources = [], entity_created_at, entity_updated_at, tags, postalcode  } = req.params;

				const result = await api.offices.upsertByEntityId({
					name,
					description,
					timezone,
					address,
					address2,
					city,
					state,
					country,
					max_capacity,
					location,
					allow_checkins,
					notice_sources,
					entity_created_at,
					entity_updated_at,
					tags,
					postalcode,
				},
				office_id,
				);

				// console.debug(`🦠  put-office result: ${JSON.stringify(result, null, 2)}`);

				const response = {
					success: true,
					meta:    result.meta,
					results: result.results,
				};

				await operationManager.validateResponse(response);

				logger.debug({ message: `success response`, body: response });
				resp.response.status(200);
				return resp.send(response, null, next);

			} catch (error) {
				logger.entering(`catch`);
				const errorResponse = ErrorManager.createErrorResponse(error, logger);
				logger.error({ message: `error response`, body: errorResponse });
				resp.response.status(errorResponse.meta.code);
				return resp.send(errorResponse, null, next);
			}
		},
	}));
