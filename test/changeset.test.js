const ObjectId = require('bson-objectid');
const Util = require('../src/index');

describe('Util.changeset', () => {
  test.skip('changeset', () => {
    const lhs = {
      id: new ObjectId('650f8a03a208dd188bc910c2'),
      name: 'lhs',
      sections: [{ id: 1, name: 'section1' }, { id: 2, name: 'section2' }, { id: 3, name: 'section3' }],
      array: ['a', 'b', 'c'],
    };

    // Empty rhs means everything was deleted
    expect(Util.changeset(lhs)).toEqual({ added: {}, updated: {}, deleted: Util.flatten(lhs) });
    expect(Util.changeset(lhs, {})).toEqual({ added: {}, updated: {}, deleted: Util.flatten(lhs) });
    expect(Util.changeset(lhs, undefined)).toEqual({ added: {}, updated: {}, deleted: Util.flatten(lhs) });

    const rhs = {
      id: new ObjectId('650f8a03a208dd188bc910c2'),
      name: 'rhs',
      frozen: 'rope',
      sections: [{ id: 1, name: 'section1', frozen: 'rope' }, { id: 3, name: 'section3' }, { id: 4, name: 'section4' }],
      array: ['a', 'c'],
    };

    // Dumb Array of Objects...
    expect(Util.changeset(lhs, rhs)).toEqual({
      added: {
        frozen: 'rope',
        'sections.0.frozen': 'rope',
      },
      updated: {
        name: 'rhs',
        'sections.1.id': 3,
        'sections.1.name': 'section3',
        'sections.2.id': 4,
        'sections.2.name': 'section4',
        'array.1': 'c',
      },
      deleted: {
        'array.2': 'c',
      },
    });

    // What I want
    expect(Util.changeset(lhs, rhs)).toEqual({
      added: {
        frozen: 'rope',
        'sections.0.frozen': 'rope',
        'sections.2.id': 4,
        'sections.2.name': 'section4',
      },
      updated: {
        name: 'rhs',
        'array.1': 'c',
      },
      deleted: {
        'array.2': 'c',
        'sections.2.id': 3,
        'sections.2.name': 'section3',
      },
    });
  });
});
