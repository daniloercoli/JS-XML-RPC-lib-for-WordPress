/**
 * Copyright (c) 2006, Opera Software ASA
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Opera Software ASA nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY OPERA SOFTWARE ASA AND CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL OPERA SOFTWARE ASA AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 *  Check for the Opera namespace and if its not setup set it up. 
 *  Also check for the Opera.Net namespace and if its not setup set it up.
 */
if(!Opera) var Opera = new Object();
if(!Opera.Net) Opera.Net = new Object();

/**
 *  The Opera.Net.Ajax class which handles the AJAX requests
 *  @constructor 
 */
Opera.Net.Ajax = function() {
	/** @private */
	var self = this;
	/** @private */
	var http_request;
	/** @private */
	var timeout_interval = null; // By default there is no timeout
	
	/**
	 * The Ajax Exception class
	 * 
	 * @param {String} status
	 * @param {String} statusText
	 */
	function AjaxException(status, statusText) {
		this.status = status;
		this.statusText = statusText;
		this.toString = function() {
			return status + " " + statusText;
		}		
	}
	
	/**
	 *  The NetworkError callback. This callback is called when there is a 
	 *  error on the server or the request times out.	 
	 */
	this.NetworkError = function(e) {
		if(typeof opera != "undefined") if(typeof opera.postError != "undefined") opera.postError(e);
	}
		
	/**
	 * A private function which is called when the object
	 * is created. 
	 */	
	function Init() {
		http_request = CreateHttpRequest();		
	}
	
	/**
	 * A private function to create a HttpRequest on different browsers.
	 */
	function CreateHttpRequest() {
		var req = null;
		if(window.XMLHttpRequest) {
          try {
            req = new XMLHttpRequest();
          }
          catch(e) {
            req = false;
          }
        }
        else if(window.ActiveXObject) {
          try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
          }
          catch(e) {
            try {
               req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch(e) {
              req = false;
            }
          }
        }
		return req;
	}
	
	
	/**
	 * The timeout for a response. It should be more than 1 second.
	 * 
	 * @param {Number} seconds 
	 */
	this.setTimeout = function(seconds) {
		if(seconds < 0) seconds = null;
		timeout_interval = seconds;
	}
	
	/**
	 * The wrapper around the GET http method to get a 
	 * file from the server
	 * 
	 * @param {String} url
	 * @param {function} callback
	 */	
	this.Get = function(url, callback) {		
		this.Connect("GET", url, "", callback);
	}
	
	/**
	 * The wrapper around the POST http method to get a 
	 * file from the server
	 *  
	 * @param {String} url
	 * @param {String} postdata
	 * @param {function} callback
	 */
	this.Post = function(url, postdata, callback) {		
		this.Connect("POST", url, postdata, callback);
	}
	
	/**
	 * A generic function to call a HTTP method on the server.
	 * 
	 * The httpmethod can be GET, POST, PUT... and any method that
	 * HTTP supports.  
	 * 
	 * @param {String} httpmethod
	 * @param {String} url
	 * @param {String} senddata
	 * @param {function} callback
	 */
	this.Connect = function(httpmethod, url, senddata, callback) {
		
		http_request.open(httpmethod, url, true);
        http_request.onreadystatechange = function() {
			if (http_request.readyState == 4) {
				try {					
				 	if(self.NetworkError) {
						/*
						 * http_request.statusCode will raise an exception if there 
						 * is an error on the server. We also raise an error if the 
						 * status code is not 200 or 0.
						 */
						if(http_request.status != 200 && http_request.status != 0) {
							throw new AjaxException(http_request.status, http_request.statusText);
						}
					}										
					callback(http_request);
				} catch(e) {
					if(self.NetworkError) self.NetworkError(e);					
				}			    
			} 
		}
		if(httpmethod == "POST") {
			http_request.setRequestHeader("Method", "POST " + url + " HTTP/1.1");
			http_request.setRequestHeader('Content-Type', 'text/xml');
			http_request.setRequestHeader('Content-Length', senddata.length);			
		}
		try {
			http_request.send(senddata);	
		} catch(e) {
			if(self.NetworkError) self.NetworkError(new AjaxException(0, e.message));	
		}
		
	}
	
	/**
	 * To setup custom Request Header in the xmlhttp object
	 * 
	 * @param {String} name
	 * @param {String} value
	 */
	this.setRequestHeader = function(name, value) {
		http_request.setRequestHeader(name, value);
	}
	
	/**
	 * To abort a XmlHttp request.
	 */
	this.abort = function() {
		http_request.abort();	
	}
	
	/**
	 * Returns the value of the named response header.
	 * 
	 * @param {String} name
	 */
	this.getResponseHeader = function (name) {
		return http_request.getResponseHeader(name);
	}
	
	/**
	 * Returns a string containg all the response headers.
	 */
	this.getAllResponseHeaders = function () {
		return http_request.getResponseHeader(name);
	}
	
	/**	 
	 * A property to get the XmlHttp object associated with this class.
	 */
	this.getXmlHttp = function() {
		return http_request;
	}
	
	Init();	
	if(http_request) return this;
	else return null;
}



