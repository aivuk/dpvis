import * as qs from 'query-string'

function parseURL (url) {
  var query = {}
  var hashURL = url.split('#')[1]

  var querySplit = hashURL.split('?')
  var queryStr = ''

  if (querySplit.length > 1) {
    queryStr = querySplit[1]
    hashURL = querySplit[0]
  }

  // Get hierarchies from hash
  var hashParts = hashURL.split('/').filter(s => s !== '')

  if (queryStr !== '') {
    query = qs.parse(queryStr)
  }

  return [hashParts, query]
}

export default parseURL
