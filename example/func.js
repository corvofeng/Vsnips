"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: func
 *
 *     Version: 1.0
 *  Created on: August 23, 2019
 *
 *      Author: corvo
 *=======================================================================
 */


LOG.debug("Hello from file");

module.exports = {
  context_example: function (vsContext) {
    LOG.debug("Get ctx:", vsContext.context);
    LOG.debug("Get doc:", vsContext.document);
    LOG.debug("Get pos:", vsContext.position);
    LOG.debug("Get tok:", vsContext.token);
    return vsContext.document.fileName;
  },
  test_for_context: function () {
    return jsFuncDecorator('context_example');
  },

  test_for_simple: function () {
    return "This is a simple func which user defined";
  },
}
