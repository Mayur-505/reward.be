const fs = require('fs');
const path = require('path');

const swagger = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'swagger.json'), 'utf8'));

// Helper to resolve $ref
function resolveRef(ref) {
  if (!ref || !ref.startsWith('#/components/schemas/')) return null;
  const name = ref.replace('#/components/schemas/', '');
  return { name, schema: swagger.components.schemas[name] };
}

// Generate example object from schema
function generateExample(schema) {
  if (!schema) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref);
    if (resolved) return generateExample(resolved.schema);
  }
  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      obj[key] = generateExample(prop);
    }
    return obj;
  }
  if (schema.type === 'array') {
    return [generateExample(schema.items || {})];
  }
  if (schema.type === 'string') {
    if (schema.enum) return schema.enum[0];
    return 'string';
  }
  if (schema.type === 'number' || schema.type === 'integer') return 0;
  if (schema.type === 'boolean') return true;
  return null;
}

// Group endpoints by tag
const tagGroups = {
  'Auth': {
    title: '1. Authentication (Admin & Operator)',
    description: 'Endpoints for registering, logging in, and retrieving profiles for backend administrators and operators.',
    endpoints: []
  },
  'Projects': {
    title: '2. Project Tenant Management',
    description: 'Endpoints for creating and configuring multi-tenant projects, managing custom coin names, welcome rewards, referral rules, and API keys.',
    endpoints: []
  },
  'Members & Wallet': {
    title: '3. Members & Coin Wallets (Admin / Service)',
    description: 'Endpoints for onboarding project members, querying balances, inspecting coin ledger transactions, and manually adjusting coins.',
    endpoints: []
  },
  'Referrals': {
    title: '4. Referral Engine & Stats',
    description: 'Endpoints for querying member referral stats, inviter/referee trees, and project-wide referral conversion events.',
    endpoints: []
  },
  'Gift Cards': {
    title: '5. Gift Cards & Redemptions',
    description: 'Endpoints for managing project gift card catalogs, handling redemption requests, and fulfilling/rejecting redemptions with automatic coin refunds.',
    endpoints: []
  },
  'Universal Coupons': {
    title: '6. Universal Coupons (Shared Across Projects)',
    description: 'Endpoints for creating global shared promo codes that can be redeemed once per member in any project.',
    endpoints: []
  },
  'External / Partner Coupons (Feedico & Gostatus)': {
    title: '7. External / Partner Coupons (Gostatus & Feedico)',
    description: 'Endpoints for querying and synchronizing external affiliate / partner coupons from Gostatus & Feedico Supabase backend.',
    endpoints: []
  },
  'My Account (End-User / Mobile)': {
    title: '8. My Account (End-User & Mobile App)',
    description: 'Self-service endpoints for mobile app end-users to check their profile, wallet balance, transaction ledger, referral codes, and redeem gift cards or coupons.',
    endpoints: []
  }
};

for (const [apiPath, methods] of Object.entries(swagger.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const rawTag = (op.tags && op.tags[0]) || 'Other';
    let targetGroup = tagGroups[rawTag];
    if (!targetGroup) {
      targetGroup = {
        title: rawTag,
        description: '',
        endpoints: []
      };
      tagGroups[rawTag] = targetGroup;
    }
    targetGroup.endpoints.push({
      method: method.toUpperCase(),
      path: apiPath,
      operationId: op.operationId,
      summary: op.summary || '',
      description: op.description || '',
      security: op.security || [],
      parameters: op.parameters || [],
      requestBody: op.requestBody,
      responses: op.responses || {}
    });
  }
}

// Generate Markdown
let md = '';

md += `# Reward & Referral Engine - Swagger API Documentation\n\n`;
md += `> **OpenAPI Specification Version**: \`3.0.0\`  \n`;
md += `> **API Version**: \`${swagger.info.version}\`  \n`;
md += `> **Application Title**: \`${swagger.info.title}\`  \n`;
md += `> **Base URL**: \`http://localhost:3000/api\` (Default)  \n\n`;

md += `## Overview & Architecture\n\n`;
md += `${swagger.info.description}\n\n`;
md += `This backend provides a complete multi-tenant rewards, referrals, coin wallets, digital gift cards, and universal coupon management platform.\n\n`;

md += `### Core Capabilities\n`;
md += `- **Multi-Tenant Data Isolation**: Projects (tenants) are isolated. Each project maintains its own members, coin balances, transaction ledgers, referral networks, and gift card catalogs.\n`;
md += `- **Universal Coupons**: Cross-project shared coupons can be created globally and redeemed once per member within each individual project.\n`;
md += `- **Referral System**: Configurable referrer and referee coin bonuses, unique referral codes per member, and referral conversion tracking.\n`;
md += `- **Gift Card Catalog & Redemptions**: Catalog management with coin-cost redemptions, inventory tracking, and admin fulfillment (approve, deliver voucher, or reject with coin refund).\n`;
md += `- **Partner Coupons Sync**: Automated and on-demand synchronization with Gostatus / Feedico partner coupons from Supabase.\n`;
md += `- **Mobile App End-User API (\`/api/me/*\`)**: Dedicated self-service routes for mobile app members to manage their profile, wallet, referrals, and redemptions.\n\n`;

md += `### Interactive Swagger UI & OpenAPI Endpoints\n\n`;
md += `| Resource | URL Path | Description |\n`;
md += `|---|---|---|\n`;
md += `| **Swagger UI (Primary)** | [\`/api/docs\`](http://localhost:3000/api/docs) | Interactive Swagger documentation & sandbox |\n`;
md += `| **Swagger UI (Alias)** | [\`/docs\`](http://localhost:3000/docs) | Alternative documentation URL |\n`;
md += `| **OpenAPI JSON Spec** | [\`/api/docs/json\`](http://localhost:3000/api/docs/json) | Full raw OpenAPI 3.0 JSON specification |\n`;
md += `| **OpenAPI YAML Spec** | [\`/api/docs/yaml\`](http://localhost:3000/api/docs/yaml) | Full raw OpenAPI 3.0 YAML specification |\n\n`;

md += `### Security & Authentication Schemes\n\n`;
md += `The API uses two primary authentication schemes:\n\n`;
md += `1. **\`JWT-auth\` (Bearer Token)**:\n`;
md += `   - **Header**: \`Authorization: Bearer <token>\`\n`;
md += `   - **Admin / Operator Access**: Used for admin operations (projects, coupon creation, gift card fulfillment, manual coin adjustments).\n`;
md += `   - **Member / Mobile Access**: Used for member self-service endpoints (\`/api/me/*\`), using the token returned by \`POST /api/projects/{projectId}/members/login\`.\n\n`;
md += `2. **\`api-key\` (\`x-api-key\`)**:\n`;
md += `   - **Header**: \`x-api-key: <project_api_key>\`\n`;
md += `   - **Project Client Integration**: Used by client applications / mobile apps to interact with project-scoped endpoints (e.g. member login/registration).\n\n`;
md += `3. **Public Endpoints**:\n`;
md += `   - Endpoints marked with no security requirement (e.g., \`POST /api/auth/register\`, \`POST /api/auth/login\`, \`GET /api/api/gostatus-coupons\`).\n\n`;

md += `--- \n\n`;

md += `## Table of Contents\n\n`;
for (const [tag, group] of Object.entries(tagGroups)) {
  const anchor = group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += `- [${group.title}](#${anchor}) (${group.endpoints.length} endpoints)\n`;
  for (const ep of group.endpoints) {
    const epAnchor = `${ep.method.toLowerCase()}-${ep.path.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    md += `  - [\`${ep.method}\` \`${ep.path}\` - ${ep.summary}](#${epAnchor})\n`;
  }
}
md += `- [Data Schemas & DTO Reference](#data-schemas--dto-reference)\n`;
md += `- [Standard Error Responses & Status Codes](#standard-error-responses--status-codes)\n`;
md += `- [Integration Workflows & Best Practices](#integration-workflows--best-practices)\n\n`;

md += `--- \n\n`;

// Detailed Endpoints
for (const [tag, group] of Object.entries(tagGroups)) {
  md += `## ${group.title}\n\n`;
  if (group.description) {
    md += `${group.description}\n\n`;
  }

  for (const ep of group.endpoints) {
    const epAnchor = `${ep.method.toLowerCase()}-${ep.path.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    md += `### \`${ep.method}\` ${ep.path}\n\n`;
    md += `**Summary**: ${ep.summary}  \n`;
    if (ep.description) {
      md += `**Description**: ${ep.description}  \n`;
    }
    md += `**Operation ID**: \`${ep.operationId}\`  \n`;

    // Security
    let secStr = 'None (Public)';
    if (ep.security && ep.security.length > 0) {
      secStr = ep.security.map(s => Object.keys(s).map(k => `\`${k}\``).join(', ')).join(' OR ');
    }
    md += `**Authentication**: ${secStr}  \n\n`;

    // Parameters
    if (ep.parameters && ep.parameters.length > 0) {
      md += `#### Parameters\n\n`;
      md += `| Name | In | Type | Required | Description | Example |\n`;
      md += `|---|---|---|---|---|---|\n`;
      for (const p of ep.parameters) {
        const schema = p.schema || {};
        const pType = schema.type || (p.type || 'string');
        const pReq = p.required ? '**Yes**' : 'No';
        const pDesc = p.description || schema.description || '-';
        const pEx = p.example !== undefined ? `\`${p.example}\`` : (schema.example !== undefined ? `\`${schema.example}\`` : '-');
        md += `| \`${p.name}\` | \`${p.in}\` | \`${pType}\` | ${pReq} | ${pDesc} | ${pEx} |\n`;
      }
      md += `\n`;
    }

    // Request Body
    if (ep.requestBody) {
      md += `#### Request Body\n\n`;
      const isReq = ep.requestBody.required ? '**Required**' : 'Optional';
      md += `- **Status**: ${isReq}\n`;
      md += `- **Content-Type**: \`application/json\`\n\n`;

      let schemaObj = null;
      let schemaName = 'Object';
      if (ep.requestBody.content && ep.requestBody.content['application/json'] && ep.requestBody.content['application/json'].schema) {
        const raw = ep.requestBody.content['application/json'].schema;
        if (raw.$ref) {
          const resolved = resolveRef(raw.$ref);
          if (resolved) {
            schemaName = resolved.name;
            schemaObj = resolved.schema;
          }
        } else {
          schemaObj = raw;
        }
      }

      if (schemaObj) {
        md += `**Schema**: [\`${schemaName}\`](#schema-${schemaName.toLowerCase()})\n\n`;
        const example = generateExample(schemaObj);
        md += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
      }
    }

    // Responses
    md += `#### Responses\n\n`;
    md += `| Status Code | Description | Schema |\n`;
    md += `|---|---|---|\n`;
    for (const [code, res] of Object.entries(ep.responses)) {
      let resSchemaName = '-';
      let resSchemaObj = null;
      if (res.content && res.content['application/json'] && res.content['application/json'].schema) {
        const s = res.content['application/json'].schema;
        if (s.$ref) {
          const resolved = resolveRef(s.$ref);
          if (resolved) {
            resSchemaName = `[\`${resolved.name}\`](#schema-${resolved.name.toLowerCase()})`;
            resSchemaObj = resolved.schema;
          }
        } else if (s.type) {
          resSchemaName = `\`${s.type}\``;
          resSchemaObj = s;
        }
      }
      md += `| \`${code}\` | ${res.description || '-'} | ${resSchemaName} |\n`;
    }
    md += `\n`;

    // Response Example if available
    for (const [code, res] of Object.entries(ep.responses)) {
      if (res.content && res.content['application/json'] && res.content['application/json'].schema) {
        const s = res.content['application/json'].schema;
        const ex = generateExample(s);
        if (ex) {
          md += `<details>\n<summary><b>Example Response (${code})</b></summary>\n\n`;
          md += `\`\`\`json\n${JSON.stringify(ex, null, 2)}\n\`\`\`\n\n</details>\n\n`;
        }
      }
    }

    // Example cURL
    md += `<details>\n<summary><b>Example cURL Request</b></summary>\n\n`;
    md += `\`\`\`bash\n`;
    let curl = `curl -X ${ep.method} "http://localhost:3000${ep.path}"`;
    if (ep.security && ep.security.some(s => s['JWT-auth'])) {
      curl += ` \\\n  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"`;
    }
    if (ep.security && ep.security.some(s => s['api-key'])) {
      curl += ` \\\n  -H "x-api-key: <PROJECT_API_KEY>"`;
    }
    if (ep.requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json"`;
      let schemaObj = null;
      if (ep.requestBody.content && ep.requestBody.content['application/json'] && ep.requestBody.content['application/json'].schema) {
        const raw = ep.requestBody.content['application/json'].schema;
        if (raw.$ref) {
          const resolved = resolveRef(raw.$ref);
          if (resolved) schemaObj = resolved.schema;
        } else {
          schemaObj = raw;
        }
      }
      if (schemaObj) {
        const exStr = JSON.stringify(generateExample(schemaObj));
        curl += ` \\\n  -d '${exStr}'`;
      }
    }
    md += `${curl}\n\`\`\`\n\n</details>\n\n`;

    md += `---\n\n`;
  }
}

// Schemas Reference
md += `## Data Schemas & DTO Reference\n\n`;
md += `Below is the detailed specification of all Data Transfer Objects (DTOs) and models utilized across request bodies and responses.\n\n`;

for (const [name, schema] of Object.entries(swagger.components.schemas || {})) {
  md += `### <a id="schema-${name.toLowerCase()}"></a>\`${name}\`\n\n`;
  if (schema.description) {
    md += `${schema.description}\n\n`;
  }

  if (schema.properties) {
    md += `| Field | Type | Required | Description | Example |\n`;
    md += `|---|---|---|---|---|---|\n`;
    const reqSet = new Set(schema.required || []);
    for (const [propName, prop] of Object.entries(schema.properties)) {
      const isReq = reqSet.has(propName) ? '**Yes**' : 'No';
      let propType = prop.type || 'object';
      if (prop.$ref) {
        const refName = prop.$ref.replace('#/components/schemas/', '');
        propType = `[\`${refName}\`](#schema-${refName.toLowerCase()})`;
      } else if (prop.type === 'array' && prop.items) {
        if (prop.items.$ref) {
          const refName = prop.items.$ref.replace('#/components/schemas/', '');
          propType = `Array<[\`${refName}\`](#schema-${refName.toLowerCase()})>`;
        } else {
          propType = `Array<${prop.items.type || 'any'}>`;
        }
      }
      const desc = prop.description || '-';
      const ex = prop.example !== undefined ? `\`${JSON.stringify(prop.example)}\`` : '-';
      md += `| \`${propName}\` | ${propType} | ${isReq} | ${desc} | ${ex} |\n`;
    }
    md += `\n`;
  }

  const sample = generateExample(schema);
  if (sample) {
    md += `**Example Object**:\n\`\`\`json\n${JSON.stringify(sample, null, 2)}\n\`\`\`\n\n`;
  }
  md += `---\n\n`;
}

// Error responses
md += `## Standard Error Responses & Status Codes\n\n`;
md += `All API errors follow the standard NestJS exception payload format:\n\n`;
md += `\`\`\`json\n`;
md += `{\n`;
md += `  "statusCode": 400,\n`;
md += `  "message": [\n`;
md += `    "email must be an email",\n`;
md += `    "password must be longer than or equal to 6 characters"\n`;
md += `  ],\n`;
md += `  "error": "Bad Request"\n`;
md += `}\n`;
md += `\`\`\`\n\n`;

md += `### Common HTTP Status Codes\n\n`;
md += `| Status Code | Meaning | Common Causes |\n`;
md += `|---|---|---|\n`;
md += `| \`200 OK\` | Success | Request succeeded and returned data. |\n`;
md += `| \`201 Created\` | Resource Created | New entity (user, project, member, coupon, etc.) successfully created. |\n`;
md += `| \`400 Bad Request\` | Validation Error | Request body failed DTO validation rules or required parameters missing. |\n`;
md += `| \`401 Unauthorized\` | Authentication Failure | Missing or invalid Bearer JWT token or API Key. |\n`;
md += `| \`403 Forbidden\` | Permission Denied | Authenticated user lacks required roles or access to resource. |\n`;
md += `| \`404 Not Found\` | Resource Not Found | Target ID, code, member, project, or coupon does not exist. |\n`;
md += `| \`409 Conflict\` | Conflict | Duplicate resource (e.g. email or coupon code already registered, coupon already redeemed). |\n`;
md += `| \`500 Internal Server Error\` | Server Exception | Unhandled internal exception occurred. |\n\n`;

// Integration Workflows
md += `## Integration Workflows & Best Practices\n\n`;

md += `### Workflow 1: Admin Quickstart\n`;
md += `1. **Register Admin**: \`POST /api/auth/register\`\n`;
md += `2. **Login**: \`POST /api/auth/login\` and obtain \`accessToken\`.\n`;
md += `3. **Create Project**: \`POST /api/projects\` specifying project code (e.g. \`POCKETLOG\`), custom currency name (\`Coins\`), welcome bonus (\`100\`), and referral rewards (\`50\` / \`25\`). Note the returned \`apiKey\`.\n`;
md += `4. **Create Gift Cards**: \`POST /api/projects/{projectId}/gift-cards\` to populate the rewards catalog.\n`;
md += `5. **Create Universal Coupons**: \`POST /api/coupons\` to create cross-project shared promotion codes.\n\n`;

md += `### Workflow 2: Mobile App End-User Integration\n`;
md += `1. **Member Login / Onboarding**:\n`;
md += `   - The mobile app calls \`POST /api/projects/{projectId}/members/login\` passing header \`x-api-key: <PROJECT_API_KEY>\` and body with \`externalUserId\` (e.g., Firebase UID or device ID) and optional \`referralCode\`.\n`;
md += `   - If new, the member is registered, awarded welcome coins, linked to referrer, and receives a JWT \`accessToken\`.\n`;
md += `2. **Authenticated Member Requests**:\n`;
md += `   - For subsequent requests, the app sends header \`Authorization: Bearer <accessToken>\` to \`/api/me/*\` endpoints:\n`;
md += `     - \`GET /api/me/profile\` -> view current spendable coins and stats.\n`;
md += `     - \`GET /api/me/transactions\` -> view transaction ledger.\n`;
md += `     - \`GET /api/me/referrals\` -> view referral code and invited friends list.\n`;
md += `     - \`GET /api/me/gift-cards\` -> view available gift card catalog.\n`;
md += `     - \`POST /api/me/gift-cards/{id}/redeem\` -> spend coins to redeem a gift card.\n`;
md += `     - \`POST /api/me/coupons/redeem\` -> redeem universal promo codes.\n`;
md += `     - \`GET /api/me/gostatus-coupons\` & \`POST /api/me/gostatus-coupons/{id}/redeem\` -> browse and redeem partner coupons.\n\n`;

md += `### Workflow 3: Gift Card Fulfillment\n`;
md += `1. Member redeems card: Coins are debited and a \`PENDING\` redemption request is created.\n`;
md += `2. Admin lists redemptions: \`GET /api/projects/{projectId}/gift-cards/redemptions\`.\n`;
md += `3. Admin fulfills: \`PUT /api/projects/{projectId}/gift-cards/redemptions/{redemptionId}/fulfill\` with \`status: "DELIVERED"\` and \`voucherCode\`.\n`;
md += `4. If rejected: Admin sets \`status: "REJECTED"\`, which automatically refunds the coin balance back to the member wallet.\n\n`;

fs.writeFileSync(path.join(__dirname, '..', 'SWAGGER_API_DOCUMENTATION.md'), md, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'API_DOCUMENTATION.md'), md, 'utf8');
console.log('Successfully generated SWAGGER_API_DOCUMENTATION.md and API_DOCUMENTATION.md!');

