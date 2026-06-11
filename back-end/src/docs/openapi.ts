const successResponse = (description: string, schemaRef?: string) => ({
    description,
    content: {
        'application/json': {
            schema: {
                allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    ...(schemaRef
                        ? [
                              {
                                  type: 'object',
                                  properties: {
                                      data: { $ref: schemaRef },
                                  },
                              },
                          ]
                        : []),
                ],
            },
        },
    },
})

const protectedRoute = [{ bearerAuth: [] }]

const openApiDocument = {
    openapi: '3.1.0',
    info: {
        title: 'ClientFlow CRM API',
        version: '0.1.0',
        description: 'API documentation for the ClientFlow CRM MVP sales pipeline.',
    },
    servers: [
        {
            url: '/api',
            description: 'Current API server',
        },
    ],
    tags: [
        { name: 'Auth' },
        { name: 'Companies' },
        { name: 'Contacts' },
        { name: 'Leads' },
        { name: 'Pipelines' },
    ],
    paths: {
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    200: successResponse('Login successful', '#/components/schemas/LoginResponseData'),
                    400: { $ref: '#/components/responses/Error' },
                    401: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/companies': {
            get: {
                tags: ['Companies'],
                summary: 'List companies',
                security: protectedRoute,
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/Limit' },
                    { $ref: '#/components/parameters/Search' },
                ],
                responses: {
                    200: successResponse('Companies retrieved successfully', '#/components/schemas/CompanyList'),
                    401: { $ref: '#/components/responses/Error' },
                },
            },
            post: {
                tags: ['Companies'],
                summary: 'Create company',
                security: protectedRoute,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CompanyCreate' },
                        },
                    },
                },
                responses: {
                    201: successResponse('Company created successfully', '#/components/schemas/Company'),
                    400: { $ref: '#/components/responses/Error' },
                    401: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/companies/{id}': {
            get: {
                tags: ['Companies'],
                summary: 'Get company by id',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                responses: {
                    200: successResponse('Company retrieved successfully', '#/components/schemas/Company'),
                    404: { $ref: '#/components/responses/Error' },
                },
            },
            patch: {
                tags: ['Companies'],
                summary: 'Update company',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CompanyUpdate' },
                        },
                    },
                },
                responses: {
                    200: successResponse('Company updated successfully', '#/components/schemas/Company'),
                    400: { $ref: '#/components/responses/Error' },
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/contacts': {
            get: {
                tags: ['Contacts'],
                summary: 'List contacts',
                security: protectedRoute,
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/Limit' },
                    { $ref: '#/components/parameters/Search' },
                    { name: 'companyId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                ],
                responses: {
                    200: successResponse('Contacts retrieved successfully', '#/components/schemas/ContactList'),
                    401: { $ref: '#/components/responses/Error' },
                },
            },
            post: {
                tags: ['Contacts'],
                summary: 'Create contact',
                security: protectedRoute,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ContactCreate' },
                        },
                    },
                },
                responses: {
                    201: successResponse('Contact created successfully', '#/components/schemas/Contact'),
                    400: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/contacts/{id}': {
            get: {
                tags: ['Contacts'],
                summary: 'Get contact by id',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                responses: {
                    200: successResponse('Contact retrieved successfully', '#/components/schemas/Contact'),
                    404: { $ref: '#/components/responses/Error' },
                },
            },
            patch: {
                tags: ['Contacts'],
                summary: 'Update contact',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ContactUpdate' },
                        },
                    },
                },
                responses: {
                    200: successResponse('Contact updated successfully', '#/components/schemas/Contact'),
                    400: { $ref: '#/components/responses/Error' },
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/leads': {
            get: {
                tags: ['Leads'],
                summary: 'List leads',
                security: protectedRoute,
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/Limit' },
                    { $ref: '#/components/parameters/Search' },
                    { name: 'companyId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'contactId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'stageId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'ownerId', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'priority', in: 'query', schema: { $ref: '#/components/schemas/LeadPriority' } },
                    { name: 'source', in: 'query', schema: { $ref: '#/components/schemas/LeadSource' } },
                ],
                responses: {
                    200: successResponse('Leads retrieved successfully', '#/components/schemas/LeadList'),
                    401: { $ref: '#/components/responses/Error' },
                },
            },
            post: {
                tags: ['Leads'],
                summary: 'Create lead',
                security: protectedRoute,
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LeadCreate' },
                        },
                    },
                },
                responses: {
                    201: successResponse('Lead created successfully', '#/components/schemas/Lead'),
                    400: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/leads/{id}': {
            get: {
                tags: ['Leads'],
                summary: 'Get lead by id',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                responses: {
                    200: successResponse('Lead retrieved successfully', '#/components/schemas/Lead'),
                    404: { $ref: '#/components/responses/Error' },
                },
            },
            patch: {
                tags: ['Leads'],
                summary: 'Update lead',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LeadUpdate' },
                        },
                    },
                },
                responses: {
                    200: successResponse('Lead updated successfully', '#/components/schemas/Lead'),
                    400: { $ref: '#/components/responses/Error' },
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/leads/{id}/stage': {
            patch: {
                tags: ['Leads'],
                summary: 'Move lead to another stage',
                security: protectedRoute,
                parameters: [{ $ref: '#/components/parameters/Id' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LeadMoveStage' },
                        },
                    },
                },
                responses: {
                    200: successResponse('Lead moved successfully', '#/components/schemas/Lead'),
                    400: { $ref: '#/components/responses/Error' },
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/pipelines': {
            get: {
                tags: ['Pipelines'],
                summary: 'List pipelines',
                security: protectedRoute,
                parameters: [
                    {
                        name: 'includeStages',
                        in: 'query',
                        schema: { type: 'boolean', default: true },
                    },
                ],
                responses: {
                    200: successResponse('Pipelines retrieved successfully', '#/components/schemas/PipelineList'),
                    401: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/pipelines/default': {
            get: {
                tags: ['Pipelines'],
                summary: 'Get default pipeline',
                security: protectedRoute,
                responses: {
                    200: successResponse('Default pipeline retrieved successfully', '#/components/schemas/Pipeline'),
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/pipelines/board': {
            get: {
                tags: ['Pipelines'],
                summary: 'Get pipeline board grouped by stage',
                security: protectedRoute,
                parameters: [{ name: 'pipelineId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    200: successResponse('Pipeline board retrieved successfully', '#/components/schemas/PipelineBoard'),
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
        '/pipelines/{pipelineId}/stages': {
            get: {
                tags: ['Pipelines'],
                summary: 'List pipeline stages',
                security: protectedRoute,
                parameters: [{ name: 'pipelineId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
                responses: {
                    200: successResponse('Pipeline stages retrieved successfully', '#/components/schemas/PipelineStageList'),
                    404: { $ref: '#/components/responses/Error' },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        parameters: {
            Id: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            Page: { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
            Limit: { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } },
            Search: { name: 'search', in: 'query', schema: { type: 'string' } },
        },
        responses: {
            Error: {
                description: 'Error response',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                    },
                },
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    statusCode: { type: 'integer' },
                    message: { type: 'string' },
                    data: {},
                    timestamp: { type: 'string', format: 'date-time' },
                },
                required: ['statusCode', 'message', 'data', 'timestamp'],
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    statusCode: { type: 'integer' },
                    statusText: { type: 'string' },
                    message: { type: 'string' },
                },
                required: ['statusCode', 'statusText', 'message'],
            },
            PaginationMeta: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
                required: ['page', 'limit', 'total', 'totalPages'],
            },
            LoginRequest: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
                required: ['email', 'password'],
            },
            LoginResponseData: {
                type: 'object',
                properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' },
                },
                required: ['user', 'token'],
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'name', 'email', 'createdAt'],
            },
            LeadSource: {
                type: 'string',
                enum: ['WEBSITE', 'REFERRAL', 'EMAIL', 'CALL', 'SOCIAL_MEDIA', 'AFFILIATE', 'OTHER'],
            },
            LeadPriority: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            },
            PipelineStageType: {
                type: 'string',
                enum: ['OPEN', 'WON', 'LOST'],
            },
            Company: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    website: { type: ['string', 'null'] },
                    industry: { type: ['string', 'null'] },
                    size: { type: ['string', 'null'] },
                    country: { type: ['string', 'null'] },
                    city: { type: ['string', 'null'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'name', 'website', 'industry', 'size', 'country', 'city', 'createdAt', 'updatedAt'],
            },
            CompanyCreate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    website: { type: 'string' },
                    industry: { type: 'string' },
                    size: { type: 'string' },
                    country: { type: 'string' },
                    city: { type: 'string' },
                },
                required: ['name'],
            },
            CompanyUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    website: { type: ['string', 'null'] },
                    industry: { type: ['string', 'null'] },
                    size: { type: ['string', 'null'] },
                    country: { type: ['string', 'null'] },
                    city: { type: ['string', 'null'] },
                },
            },
            CompanyList: {
                type: 'object',
                properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                },
                required: ['items', 'meta'],
            },
            Contact: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    companyId: { type: ['string', 'null'], format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: ['string', 'null'], format: 'email' },
                    phone: { type: ['string', 'null'] },
                    jobTitle: { type: ['string', 'null'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    company: { anyOf: [{ $ref: '#/components/schemas/Company' }, { type: 'null' }] },
                },
                required: ['id', 'companyId', 'firstName', 'lastName', 'email', 'phone', 'jobTitle', 'createdAt', 'updatedAt', 'company'],
            },
            ContactCreate: {
                type: 'object',
                properties: {
                    companyId: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    jobTitle: { type: 'string' },
                },
                required: ['firstName', 'lastName'],
            },
            ContactUpdate: {
                type: 'object',
                properties: {
                    companyId: { type: ['string', 'null'], format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: ['string', 'null'], format: 'email' },
                    phone: { type: ['string', 'null'] },
                    jobTitle: { type: ['string', 'null'] },
                },
            },
            ContactList: {
                type: 'object',
                properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Contact' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                },
                required: ['items', 'meta'],
            },
            PipelineStage: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    pipelineId: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    order: { type: 'integer' },
                    type: { $ref: '#/components/schemas/PipelineStageType' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'pipelineId', 'name', 'order', 'type', 'createdAt', 'updatedAt'],
            },
            Pipeline: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    stages: { type: 'array', items: { $ref: '#/components/schemas/PipelineStage' } },
                },
                required: ['id', 'name', 'createdAt', 'updatedAt'],
            },
            PipelineList: {
                type: 'array',
                items: { $ref: '#/components/schemas/Pipeline' },
            },
            PipelineStageList: {
                type: 'array',
                items: { $ref: '#/components/schemas/PipelineStage' },
            },
            Lead: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    companyId: { type: ['string', 'null'], format: 'uuid' },
                    contactId: { type: ['string', 'null'], format: 'uuid' },
                    ownerId: { type: 'string', format: 'uuid' },
                    stageId: { type: 'string', format: 'uuid' },
                    value: { type: 'string' },
                    source: { $ref: '#/components/schemas/LeadSource' },
                    priority: { $ref: '#/components/schemas/LeadPriority' },
                    expectedCloseDate: { type: ['string', 'null'], format: 'date-time' },
                    closedAt: { type: ['string', 'null'], format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    company: { anyOf: [{ $ref: '#/components/schemas/Company' }, { type: 'null' }] },
                    contact: { anyOf: [{ $ref: '#/components/schemas/Contact' }, { type: 'null' }] },
                    stage: { $ref: '#/components/schemas/PipelineStage' },
                    owner: { anyOf: [{ $ref: '#/components/schemas/User' }, { type: 'null' }] },
                },
                required: ['id', 'title', 'companyId', 'contactId', 'ownerId', 'stageId', 'value', 'source', 'priority', 'createdAt', 'updatedAt'],
            },
            LeadCreate: {
                type: 'object',
                description: 'companyId or contactId is required.',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    companyId: { type: 'string', format: 'uuid' },
                    contactId: { type: 'string', format: 'uuid' },
                    ownerId: { type: 'string', format: 'uuid', description: 'Defaults to the authenticated user when omitted.' },
                    stageId: { type: 'string', format: 'uuid' },
                    value: { type: 'number', minimum: 0, default: 0 },
                    source: { $ref: '#/components/schemas/LeadSource' },
                    priority: { $ref: '#/components/schemas/LeadPriority' },
                    expectedCloseDate: { type: 'string', format: 'date-time' },
                },
                required: ['title', 'stageId'],
                anyOf: [{ required: ['companyId'] }, { required: ['contactId'] }],
            },
            LeadUpdate: {
                type: 'object',
                description: 'After update, companyId or contactId must still be present.',
                properties: {
                    title: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    companyId: { type: ['string', 'null'], format: 'uuid' },
                    contactId: { type: ['string', 'null'], format: 'uuid' },
                    ownerId: { type: 'string', format: 'uuid' },
                    stageId: { type: 'string', format: 'uuid' },
                    value: { type: 'number', minimum: 0 },
                    source: { $ref: '#/components/schemas/LeadSource' },
                    priority: { $ref: '#/components/schemas/LeadPriority' },
                    expectedCloseDate: { type: ['string', 'null'], format: 'date-time' },
                    closedAt: { type: ['string', 'null'], format: 'date-time' },
                },
            },
            LeadMoveStage: {
                type: 'object',
                properties: {
                    stageId: { type: 'string', format: 'uuid' },
                },
                required: ['stageId'],
            },
            LeadList: {
                type: 'object',
                properties: {
                    items: { type: 'array', items: { $ref: '#/components/schemas/Lead' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                },
                required: ['items', 'meta'],
            },
            BoardStage: {
                allOf: [
                    { $ref: '#/components/schemas/PipelineStage' },
                    {
                        type: 'object',
                        properties: {
                            leads: { type: 'array', items: { $ref: '#/components/schemas/Lead' } },
                        },
                        required: ['leads'],
                    },
                ],
            },
            PipelineBoard: {
                type: 'object',
                properties: {
                    pipeline: { $ref: '#/components/schemas/Pipeline' },
                    stages: { type: 'array', items: { $ref: '#/components/schemas/BoardStage' } },
                },
                required: ['pipeline', 'stages'],
            },
        },
    },
} as const

export { openApiDocument }
