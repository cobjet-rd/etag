
var assert = require('assert')
var etag = require('..')
var fs = require('fs')
var seedrandom = require('seedrandom')

var buf5kb = getbuffer(5 * 1024)
var str5kb = getbuffer(5 * 1024).toString()

describe('etag(entity)', function () {
  it('should require an entity', function () {
    assert.throws(etag.bind(), /argument entity is required/)
  })

  it('should reject number entities', function () {
    assert.throws(etag.bind(null, 4), /argument entity must be/)
  })

  describe('when "entity" is a string', function () {
    it('should generate a strong ETag', function () {
      assert.equal(etag('beep boop'), '"Z34SGyQ2IB7YzB7HMkCjrQ=="')
    })

    it('should work containing Unicode', function () {
      assert.equal(etag('论'), '"aW9HeLTk2Yt6lf7zJYElgw=="')
      assert.equal(etag('论', {weak: true}), 'W/"3-438093ff"')
    })

    it('should work for empty string', function () {
      assert.equal(etag(''), '"1B2M2Y8AsgTpgAmY7PhCfg=="')
    })
  })

  describe('when "entity" is a Buffer', function () {
    it('should generate a strong ETag', function () {
      assert.equal(etag(new Buffer([1, 2, 3])), '"Uonfc331cyb83SJZevsfrA=="')
    })

    it('should work for empty Buffer', function () {
      assert.equal(etag(new Buffer(0)), '"1B2M2Y8AsgTpgAmY7PhCfg=="')
    })
  })

  describe('when "entity" is a fs.Stats', function () {
    it('should generate a weak ETag', function () {
      assert.ok(isweak(etag(fs.statSync(__filename))))
    })

    it('should generate consistently', function () {
      assert.equal(etag(fs.statSync(__filename)), etag(fs.statSync(__filename)))
    })
  })

  describe('when "entity" looks like a stats object', function () {
    it('should generate a weak ETag', function () {
      var fakeStat = {
        atime: new Date('2014-09-01T14:52:07Z'),
        ctime: new Date('2014-09-01T14:52:07Z'),
        mtime: new Date('2014-09-01T14:52:07Z'),
        ino: 0,
        size: 3027
      }
      assert.equal(etag(fakeStat), 'W/"bd3-1182194534"')
    })
  })

  describe('with "weak" option', function () {
    describe('when "false"', function () {
      it('should generate a strong ETag for a string', function () {
        assert.equal(etag('', {weak: false}), '"1B2M2Y8AsgTpgAmY7PhCfg=="')
        assert.equal(etag('beep boop', {weak: false}), '"Z34SGyQ2IB7YzB7HMkCjrQ=="')
        assert.equal(etag(str5kb, {weak: false}), '"8Kq68cJq4i+5US7RLWrE1g=="')
      })

      it('should generate a strong ETag for a Buffer', function () {
        assert.equal(etag(new Buffer(0), {weak: false}), '"1B2M2Y8AsgTpgAmY7PhCfg=="')
        assert.equal(etag(new Buffer([1, 2, 3]), {weak: false}), '"Uonfc331cyb83SJZevsfrA=="')
        assert.equal(etag(buf5kb, {weak: false}), '"8Kq68cJq4i+5US7RLWrE1g=="')
      })

      it('should generate a strong ETag for fs.Stats', function () {
        assert.ok(!isweak(etag(fs.statSync(__filename), {weak: false})))
      })
    })

    describe('when "true"', function () {
      it('should generate a weak ETag for a string', function () {
        assert.equal(etag('', {weak: true}), 'W/"0-0"')
        assert.equal(etag('beep boop', {weak: true}), 'W/"9-7f3ee715"')
        assert.equal(etag(str5kb, {weak: true}), 'W/"3Ikd9BFqLeTIltAti5IvKg=="')
      })

      it('should generate a weak ETag for a Buffer', function () {
        assert.equal(etag(new Buffer(0), {weak: true}), 'W/"0-0"')
        assert.equal(etag(new Buffer([1, 2, 3]), {weak: true}), 'W/"3-55bc801d"')
        assert.equal(etag(buf5kb, {weak: true}), 'W/"3Ikd9BFqLeTIltAti5IvKg=="')
      })

      it('should generate a weak ETag for fs.Stats', function () {
        assert.ok(isweak(etag(fs.statSync(__filename), {weak: true})))
      })
    })
  })
})

function getbuffer(size) {
  var buffer = new Buffer(size)
  var rng = seedrandom('etag test')

  for (var i = 0; i < buffer.length; i++) {
    buffer[i] = (rng() * 94 + 32) | 0
  }

  return buffer
}

function isweak(etag) {
  var weak = /^(W\/|)"([^"]+)"/.exec(etag)

  if (weak === null) {
    throw new Error('invalid ETag: ' + etag)
  }

  return weak[1] === 'W/'
}
