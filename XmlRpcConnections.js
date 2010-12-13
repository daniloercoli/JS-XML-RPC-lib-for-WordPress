function XmlRpcBaseConn(_username, _password, _url) {
		this.username = _username;
		this.password = _password;
		this.url = _url;
		this.listeners = [];
		this.isStopped = false;
		this.method = "";
		this.request = null;
}

XmlRpcBaseConn.prototype.addListener = function(data) {
  var type = typeof data;
  switch(type.toLowerCase()) {
    case "function":
	  return;
	case "object":
	this.listeners.push(data);  
  }
};

XmlRpcBaseConn.prototype.clearListeners = function() {
	EW.LogSystem.debug("XmlRpcBaseConn.prototype.clearListeners");
  	this.listeners.splice(0, this.listeners.length);
};

XmlRpcBaseConn.prototype.startConn = function () {
	EW.LogSystem.debug(">>> XmlRpcBaseConn.prototype.startConn");
	this.execute();
}

/* this is an abstract method, each inhereted conn must reimplements it*/
XmlRpcBaseConn.prototype.execute = function () {
	EW.LogSystem.debug(">>> XmlRpcBaseConn.prototype.excute");
}

XmlRpcBaseConn.prototype.stopConn = function () {
	EW.LogSystem.debug(">>> XmlRpcBaseConn.prototype.stopConn");
	this.isStopped = true;
	if(this.request !== null) {
		this.request.stop();
	}
	this.stopCallback();
}

/**
 * Chiamato quando la connessione viene stoppata dall'utente. Notifichiamo tutti i listener in ascolto.
 * 
 */
XmlRpcBaseConn.prototype.stopCallback = function () {
	EW.LogSystem.debug("XmlRpcBaseConn.prototype.stopCallback");
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestStopped();
    }
}

/**
 * Chiamato quando il server xmlrpc risponde correttamente
 * ogni connessione deve ridefinire questo metodo per trattare la risposta correttamente.
 */
XmlRpcBaseConn.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
}

/**
 * Chiamato nel caso di errore
 */
XmlRpcBaseConn.prototype.errorCallback = function (faultCode, faultString) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	
	EW.LogSystem.error("XmlRpcBaseConn.prototype.errorCallback");
	errorObj = {
	 	name: faultCode,
	 	message: faultString
	}

	if("undefined" == typeof faultCode) {
		errorObj.name ="0"
		errorObj.message = "Server did not return any results.";
	}
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestError(errorObj); //ai listener arriva un oggetto JS
    }		
}


function AddBlogConn(_username, _password, _url) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
}

AddBlogConn.prototype =  new XmlRpcBaseConn;

AddBlogConn.prototype.execute = function () {
	EW.LogSystem.debug("AddBlogConn.execute");
	try {
		//this.method = "blogger.getUsersBlogs";
		
		this.method = "wp.getUsersBlogs";
		this.request = new XmlRpcRequest(this.url, this.method);
		//this.request.addParam("1");
		this.request.addParam(this.username);
		this.request.addParam(this.password);
		this.request.addListener(this);
		this.request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

/**
 * Chiamato nel caso di errore nell'aggiunta di un blog
 */
AddBlogConn.prototype.errorCallback = function (faultCode, faultString) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	
	EW.LogSystem.error("AddBlogConn.prototype.errorCallback");
	
	var _errMessage = ""; 
	if("undefined" == typeof faultCode) {
		_errMessage = "Server did not return any results. Make sure that the blog url is correct. Remove the www incase you are using it. <br /> <br /> <strong>TIP</strong>: You can go back and change the url.";
	} else {
		_errMessage = faultCode +" - "+ faultString; 
	}
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestError(_errMessage); //ai listener arriva un oggetto JS
    }		
}

AddBlogConn.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("AddBlogConn.successCallback"); 
	for(var x=0; x < jsParsedObj.length; x++)
	{
		EW.LogSystem.debug("Inizio lettura blog "+x);
		EW.LogSystem.debug( jsParsedObj[x].isAdmin );
		EW.LogSystem.debug( jsParsedObj[x].url ); 
		EW.LogSystem.debug( jsParsedObj[x].blogid );
		EW.LogSystem.debug( jsParsedObj[x].blogName);
		EW.LogSystem.debug( jsParsedObj[x].xmlrpc);
		//correggo eventualmente la url dell'endpoint...(rivedere come ho fatto nella versione java, dopo aver inserito l'autodiscovery)
		/*
		if((jsObj[x], "xmlrpc")) _userBlogs[x]["xmlrpc"] = (jsObj[x], "xmlrpc");					
		else _userBlogs[x]["xmlrpc"] =  (jsObj[x], "url") +  "xmlrpc.php";*/
		//aggiungo le altre due propriet� che mancano...
		jsParsedObj[x].username = this.username;
		jsParsedObj[x].password = this.password;
	}
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}

function GetCommentsConn(_username, _password, _url) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.post_id = "";
	this.offset = 0;
	this.number = 100;
	this.status = "";
}

GetCommentsConn.prototype =  new XmlRpcBaseConn;

GetCommentsConn.prototype.setOffset = function (newOffset) {
	this.offset = newOffset;
}

GetCommentsConn.prototype.setNumber = function (_number) {
	this.number = _number;
}

GetCommentsConn.prototype.execute = function () {
	EW.LogSystem.debug("wp.getComments ");
	try {
		var method = "wp.getComments";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		var options = {
			 post_id : this.post_id,
			 status : this.status,
			 offset : this.offset,
			 number : this.number 
		}

		request.addParam(options);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

GetCommentsConn.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se � stata stoppata non fare nulla
	EW.LogSystem.debug("getComments.successCallback"); 
	for(var x=0; x < jsParsedObj.length; x++)
	{
		
	}
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}



function GetCommentCount(_username, _password, _url) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.post_id = -1;
}

GetCommentCount.prototype =  new XmlRpcBaseConn;
GetCommentCount.prototype.execute = function () {
	EW.LogSystem.debug("wp.getComments");
	try {
		var method = "wp.getCommentCount";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.post_id);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

GetCommentCount.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se � stata stoppata non fare nulla
	EW.LogSystem.debug("GetCommentCount.successCallback"); 
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}


/**
 * Delete Comment Connection
 */

function DeleteComment(_username, _password, _url, commentID) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.commentID = commentID;
}

DeleteComment.prototype =  new XmlRpcBaseConn;
DeleteComment.prototype.execute = function () {
	EW.LogSystem.debug("wp.deleteComment");
	try {
		var method = "wp.deleteComment";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.commentID);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

DeleteComment.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("DeleteComment.successCallback"); 
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}


/**
 * Edit Comment Connection
 */

function EditComment(_username, _password, _url, comment) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.comment = comment;
}

EditComment.prototype =  new XmlRpcBaseConn;
EditComment.prototype.execute = function () {
	EW.LogSystem.debug("wp.editComment");
	try {
		var method = "wp.editComment";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.comment.comment_id);
		request.addParam(this.comment);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

EditComment.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("EditComment.successCallback"); 
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}




/**
 * Edit Comment Connection
 */

function ReplyComment(_username, _password, _url, _post_id, _comment_reply) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.post_id = _post_id;
	this.comment_reply = _comment_reply;
}

ReplyComment.prototype =  new XmlRpcBaseConn;
ReplyComment.prototype.execute = function () {
	EW.LogSystem.debug("wp.newComment ");
	try {
		var method = "wp.newComment";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.post_id);
		request.addParam(this.comment_reply);
		request.addListener(this);
		request.send();
	} catch (error_obj) {
		EW.Utils.showErrorDialog ("Error", error_obj);
	}
}

ReplyComment.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("ReplyComment.successCallback"); 
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}



/**
 * Get Comment Connection
 */

function GetComment(_username, _password, _url, _comment_id) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.comment_id = _comment_id;
}

GetComment.prototype =  new XmlRpcBaseConn;
GetComment.prototype.execute = function () {
	EW.LogSystem.debug("wp.getComment ");
	try {
		var method = "wp.getComment";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.comment_id);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

GetComment.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("GetComment.successCallback"); 
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}

/**
 * New Post Connection
 */

function NewPost(_username, _password, _url, _content) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.content = _content;
	/*
	 * The struct content can contain the following standard keys:
    * title, for the title of the entry;
    * description, for the body of the entry;
    * dateCreated, to set the created-on date of the entry;
	 */
}

NewPost.prototype =  new XmlRpcBaseConn;
NewPost.prototype.execute = function () {
	EW.LogSystem.debug("wp.getComment ");
	try {
		var method = "metaWeblog.newPost";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.content);
		request.addParam(true);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
}

NewPost.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("NewPost.successCallback"); 
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj); //ai listener arriva un oggetto JS
    }		
}