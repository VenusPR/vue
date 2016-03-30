import { getPath } from '../parsers/path'
import vFor from '../directives/public/for'
import {
  toArray,
  toNumber,
  isArray,
  isObject,
  isPlainObject
} from '../util/index'
const convertArray = vFor._postProcess

/**
 * Limit filter for arrays
 *
 * @param {Number} n
 * @param {Number} offset (Decimal expected)
 */

export function limitBy (arr, n, offset) {
  offset = offset ? parseInt(offset, 10) : 0
  n = toNumber(n)
  return typeof n === 'number'
    ? arr.slice(offset, offset + n)
    : arr
}

/**
 * Filter filter for arrays
 *
 * @param {String} search
 * @param {String} [delimiter]
 * @param {String} ...dataKeys
 */

export function filterBy (arr, search, delimiter) {
  arr = convertArray(arr)
  if (search == null) {
    return arr
  }
  if (typeof search === 'function') {
    return arr.filter(search)
  }
  // cast to lowercase string
  search = ('' + search).toLowerCase()
  // allow optional `in` delimiter
  // because why not
  var n = delimiter === 'in' ? 3 : 2
  // extract and flatten keys
  var keys = toArray(arguments, n).reduce(function (prev, cur) {
    return prev.concat(cur)
  }, [])
  var res = []
  var item, key, val, j
  for (var i = 0, l = arr.length; i < l; i++) {
    item = arr[i]
    val = (item && item.$value) || item
    j = keys.length
    if (j) {
      while (j--) {
        key = keys[j]
        if ((key === '$key' && contains(item.$key, search)) ||
            contains(getPath(val, key), search)) {
          res.push(item)
          break
        }
      }
    } else if (contains(item, search)) {
      res.push(item)
    }
  }
  return res
}

/**
 * Filter filter for arrays
 *
 * @param {String|Array<String>} sortKeys
 * @param {Boolean} [order]
 */

export function orderBy (arr, sortKeys, order) {
  arr = convertArray(arr)
  order = (order && order < 0) ? -1 : 1

  if (typeof sortKeys === 'string') {
    sortKeys = [sortKeys]
  } else if (!sortKeys || (sortKeys !== true && !sortKeys.length)) {
    // we check if sortKeys === true because you can sort primitive values with
    // array | orderBy true: http://vuejs.org/api/#orderBy
    return arr
  }

  function compare (a, b, sortKeyIndex) {
    const sortKey = sortKeys[sortKeyIndex]
    if (sortKey !== '$key') {
      if (isObject(a) && '$value' in a) a = a.$value
      if (isObject(b) && '$value' in b) b = b.$value
    }
    a = isObject(a) ? getPath(a, sortKey) : a
    b = isObject(b) ? getPath(b, sortKey) : b
    return a === b ? 0 : a > b ? order : -order
  }

  function recursiveCompare (a, b, i) {
    i = i || 0
    if (sortKeys === true || i === sortKeys.length - 1) {
      return compare(a, b, i)
    }
    return compare(a, b, i) || recursiveCompare(a, b, i + 1)
  }

  // sort on a copy to avoid mutating original array
  return arr.slice().sort(recursiveCompare)
}

/**
 * String contain helper
 *
 * @param {*} val
 * @param {String} search
 */

function contains (val, search) {
  var i
  if (isPlainObject(val)) {
    var keys = Object.keys(val)
    i = keys.length
    while (i--) {
      if (contains(val[keys[i]], search)) {
        return true
      }
    }
  } else if (isArray(val)) {
    i = val.length
    while (i--) {
      if (contains(val[i], search)) {
        return true
      }
    }
  } else if (val != null) {
    return val.toString().toLowerCase().indexOf(search) > -1
  }
}
