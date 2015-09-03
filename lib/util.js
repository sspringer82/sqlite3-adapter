import _ from 'lodash'
import Adapter from './adapter'
import CriteriaParser from 'waterline-sequel/sequel/lib/criteriaProcessor'

const Util = {

  /**
   * Create a column for Knex from a Waterline atribute definition
   * https://www.sqlite.org/datatype3.html
   */
  toKnexColumn (table, _name, attrDefinition) {
    let attr = _.isObject(attrDefinition) ? attrDefinition : { type: attrDefinition }
    let type = attr.autoIncrement ? 'serial' : attr.type
    let name = attr.columnName || _name

    switch (type.toLowerCase()) {
      case 'text':
      case 'mediumtext':
      case 'longtext':
      case 'string':
      case 'json':
      case 'array':
        return table.text(name, type)

      case 'datestamp':
      case 'datetime':
      case 'date':
        return table.dateTime(name)

      /**
       * table.integer(name) 
       * Adds an integer column.
       */
      case 'boolean':
      case 'serial':
      case 'smallserial':
      case 'bigserial':
      case 'int':
      case 'integer':
      case 'smallint':
      case 'bigint':
      case 'biginteger':
        return table.integer(name)

      /**
       * table.float(column, [precision], [scale]) 
       * Adds a float column, with optional precision and scale.
       */
      case 'real':
      case 'float':
      case 'double':
      case 'decimal':
        return table.specificType(name, 'REAL')

      case 'binary':
      case 'bytea':
        return table.binary(name)

      case 'sqltype':
      case 'sqlType':
        return table.specificType(name, type)

      default:
        console.error('Unregistered type given for attribute. name=', name, '; type=', type)
        return table.text(name)
    }
  },

  /**
   * Apply a primary key constraint to a table
   *
   * @param table - a knex table object
   * @param definition - a waterline attribute definition
   */
  applyPrimaryKeyConstraints (table, definition) {
    let primaryKeys = _.keys(_.pick(definition, attribute => {
      return attribute.primaryKey
    }))

    return table.primary(primaryKeys)
  },

  applyTableConstraints(table, definition) {
    return this.applyPrimaryKeyConstraints(table, definition)
  },

  applyColumnConstraints (column, definition) {
    if (_.isString(definition)) {
      return
    }
    return _.map(definition, (value, key) => {
      if (key == 'defaultsTo' && definition.autoIncrement && value == 'AUTO_INCREMENT') {
        return
      }

      return this.applyParticularColumnConstraint(column, key, value, definition)
    })
  },

  applyParticularColumnConstraint (column, constraintName, value, definition) {
    if (!value) return

    switch (constraintName) {
      
      case 'index':
        return column.index(_.get(value, 'indexName'), _.get(value, 'indexType'))

      /**
       * Acceptable forms:
       * attr: { unique: true }
       * attr: {
       *   unique: {
       *     unique: true, // or false
       *     composite: [ 'otherAttr' ]
       *   }
       * }
       */
      case 'unique':
        if ((value === true || _.get(value, 'unique') === true) && !definition.primaryKey) {
          column.unique()
        }
        return

      case 'notNull':
        return column.notNullable()

      case 'defaultsTo':
        return column.defaultTo(value)

      case 'type':
        return
      case 'primaryKey':
        return
      case 'autoIncrement':
        return
      case 'on':
        //console.log('on', value)
        return
      case 'via':
        //console.log('via', value)
        return
      case 'foreignKey':
        //console.log('foreignKey', value)
        return
      case 'references':
        //console.log('references', value)
        return
      case 'model':
        //console.log('model', value)
        return
      case 'alias':
        //console.log('alias', value)
        return

      default:
        console.error('Unknown constraint [', constraintName, '] on column')
    }
  },

  /**
   * Convert a paramterized waterline query into a knex-compatible query string
   */
  toKnexRawQuery (sql) {
    return sql.replace(/\$\d+/g, '?')
  },

  castSqlValues (values, model) {
    return _.mapValues(values, (value, attr) => {
      let definition = model.definition[attr]
      if (_.contains([ 'date', 'datetime', 'datestamp'], definition.type)) {
        return new Date(value)
      }

      return value
    })
  },

  /**
   * Cast values to the correct type
   */
  castValues (values) {
    return _.map(values, value => {
      if (_.isString(value) && value[0] === '[') {
        let arr = JSON.parse(value)
        if (_.isArray(arr)) {
          return arr
        }
      }

      return value
    })
  },

}

_.bindAll(Util)
export default Util