'use strict';

/* global chai: false */

var expect = chai.expect;


describe('The meetings.configuration module', function() {

  var easyRTCService, easyRTCBitRates, easyRTCDefaultBitRate, localStorageService, instance;

  beforeEach(function() {
    module('meetings.configuration');
    module('meetings.jade.templates');
  });

  beforeEach(angular.mock.module(function($provide) {
    easyRTCBitRates = {rate1: 'config1', rate2: 'config2'};
    easyRTCDefaultBitRate = 'rate2';
    easyRTCService = {};
    instance = {};
    localStorageService = {
      getOrCreateInstance: function(name) {
        expect(name).to.equal('roomConfiguration');
        instance.setItem = function() {
          return {
            finally: function(callback) {
              callback();
            }
          };
        };
        return instance;
      }
    };
    $provide.value('easyRTCService', easyRTCService);
    $provide.value('easyRTCBitRates', easyRTCBitRates);
    $provide.value('easyRTCDefaultBitRate', easyRTCDefaultBitRate);
    $provide.value('localStorageService', localStorageService);
  }));

  describe('The conferenceConfiguration directive', function() {

    before(function() {
      this.generateString = function(length) {
        return new Array(length + 1).join('a');
      };
    });

    beforeEach(inject(function($compile, $rootScope) {
      this.scope = $rootScope.$new();

      instance.getItem = function() {
        return {
          then: function(successCallback, errorCallback) {
            errorCallback();
          }
        };
      };
      easyRTCService.configureBandwidth = function() {};

      $compile('<conference-configuration />')(this.scope);
      this.scope.$digest();
    }));

    describe('the onUsernameChange function', function() {

      it('should do nothing if configuration.display.username is undefined', function() {
        this.scope.configuration = {};
        this.scope.onUsernameChange();
        expect(this.scope.configuration).to.deep.equal({});
        expect(this.scope.lengthError).to.be.false;
      });

      it('should do nothing if configuration.display.username is not too long', function() {
        var userName = 'aName';
        this.scope.configuration = {
          displayName: userName
        };
        this.scope.onUsernameChange();
        expect(this.scope.configuration.displayName).to.deep.equal(userName);
        expect(this.scope.lengthError).to.be.false;
      });

      it('should set lengthError to true if configuration.display.username is not 199 chars long', function() {
        var userName = this.generateString(199);
        this.scope.configuration = {
          displayName: userName
        };
        this.scope.onUsernameChange();
        expect(this.scope.configuration.displayName).to.deep.equal(userName);
        expect(this.scope.lengthError).to.be.true;
      });

      it('should set lengthError to true and truncate username if configuration.display.username is 200 chars long', function() {
        var userName = this.generateString(200);
        this.scope.configuration = {
          displayName: userName
        };
        this.scope.onUsernameChange();
        expect(this.scope.configuration.displayName).to.deep.equal(this.generateString(199));
        expect(this.scope.lengthError).to.be.true;
      });

      it('should set lengthError to true and truncate username if configuration.display.username is more than 200 chars long', function() {
        var userName = this.generateString(250);
        this.scope.configuration = {
          displayName: userName
        };
        this.scope.onUsernameChange();
        expect(this.scope.configuration.displayName).to.deep.equal(this.generateString(199));
        expect(this.scope.lengthError).to.be.true;
      });

    });
  });

  describe('The bitrateConfiguration directive', function() {

    beforeEach(inject(function($compile, $rootScope) {
      this.scope = $rootScope.$new();
      this.compile = $compile;
    }));

    it('should select the bitrate from localStorage if it exists', function(done) {
      var testRate = 'rate1';
      instance.getItem = function() {
        return {
          then: function(successCallback) {
            successCallback(testRate);
          }
        };
      };
      easyRTCService.configureBandwidth = function(rate) {
        expect(rate).to.equal(testRate);
        done();
      };
      this.compile('<bitrate-configuration />')(this.scope);
      this.scope.$digest();
    });

    it('should select the default bitrate if nothing is in the localStorage', function(done) {
      instance.getItem = function() {
        return {
          then: function(successCallback) {
            successCallback(null);
          }
        };
      };
      easyRTCService.configureBandwidth = function(rate) {
        expect(rate).to.equal(easyRTCDefaultBitRate);
        done();
      };
      this.compile('<bitrate-configuration />')(this.scope);
      this.scope.$digest();
    });

    it('should select the default bitrate if localStorage search fails', function(done) {
      instance.getItem = function() {
        return {
          then: function(successCallback, errorCallback) {
            errorCallback();
          }
        };
      };
      easyRTCService.configureBandwidth = function(rate) {
        expect(rate).to.equal(easyRTCDefaultBitRate);
        done();
      };
      this.compile('<bitrate-configuration />')(this.scope);
      this.scope.$digest();
    });

    describe('the selectBitRate function', function() {

      beforeEach(function() {
        instance.getItem = function() {
          return {
            then: function() {}
          };
        };
        this.compile('<bitrate-configuration />')(this.scope);
        this.scope.$digest();
      });

      it('should do nothing if argumentBitRate does not exist in easyRTCBitrates constant', function(done) {
        easyRTCService.configureBandwidth = function() {
          done(new Error('Should not have been called'));
        };
        this.scope.selectBitRate('bitRateThatDoesNotExist');
        done();
      });

      it('should store the selectBitRate and call easyRTCService#configureBandwidth with the correct rate', function(done) {
        var testRate = 'rate1';
        easyRTCService.configureBandwidth = function(rate) {
          expect(rate).to.equal(testRate);
          done();
        };
        instance.setItem = function(key, value) {
          expect(key).to.equal('bitRate');
          expect(value).to.equal(testRate);
          return {
            finally: function(callback) {
              callback();
            }
          };
        };
        this.scope.selectBitRate(testRate);
      });
    });

  });

  describe('The disableVideoConfiguration directive', function() {

    beforeEach(inject(function($compile, $rootScope) {
      this.scope = $rootScope.$new();
      this.compile = $compile;
    }));

    beforeEach(function() {
      instance.getItem = function() {
        return {
          then: function() {}
        };
      };
      this.compile('<disable-video-configuration />')(this.scope);
      this.scope.$digest();
    });

    describe('the changeVideoSetting function', function() {
      it('should invert scope.videoEnabled value call easyRTCService.enableVideo with it', function(done) {
        var self = this;
        easyRTCService.enableVideo = function(enableVideo) {
          expect(self.scope.videoEnabled).to.be.false;
          expect(enableVideo).to.be.false;
          done();
        };
        this.scope.videoEnabled = true;
        this.scope.changeVideoSetting();
      });
    });

  });

});
