fetch('http://localhost:3002/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types { ...FullType }
        directives { name description locations args { ...InputValue } }
      }
    }
    fragment FullType on __Type {
      kind name description
      fields(includeDeprecated: true) {
        name description args { ...InputValue }
        type { ...TypeRef }
        isDeprecated deprecationReason
      }
      inputFields { ...InputValue }
      interfaces { ...TypeRef }
      enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason }
      possibleTypes { ...TypeRef }
    }
    fragment InputValue on __InputValue {
      name description type { ...TypeRef } defaultValue
    }
    fragment TypeRef on __Type {
      kind name
      ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } }
    }
  `})
})
  .then((res) => res.json())
  .then((result) => {
    const { buildClientSchema, printSchema } = require('graphql');
    const schema = buildClientSchema(result.data);
    const sdl = printSchema(schema);
    const fs = require('fs');
    fs.writeFileSync('apps/driver-frontend/lib/core/graphql/schema.gql', sdl);
    console.log('DONE - schema.gql updated with', sdl.length, 'characters');
  })
  .catch((err) => console.error('ERROR:', err.message));
