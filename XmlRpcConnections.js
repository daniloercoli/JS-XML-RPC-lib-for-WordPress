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
};

/* this is an abstract method, each inhereted conn must reimplements it*/
XmlRpcBaseConn.prototype.execute = function () {
	EW.LogSystem.debug(">>> XmlRpcBaseConn.prototype.excute");
};

XmlRpcBaseConn.prototype.stopConn = function () {
	EW.LogSystem.debug(">>> XmlRpcBaseConn.prototype.stopConn");
	this.isStopped = true;
	if(this.request !== null) {
		this.request.stop();
	}
	this.stopCallback();
};

/**
 * Chiamato quando la connessione viene stoppata dall'utente. Notifichiamo tutti i listener in ascolto.
 * 
 */
XmlRpcBaseConn.prototype.stopCallback = function () {
	EW.LogSystem.debug("XmlRpcBaseConn.prototype.stopCallback");
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestStopped();
    }
};

/**
 * Called when the server responds correctly xmlrpc
 */
XmlRpcBaseConn.prototype.successCallback = function (xmlRpcResponseObj, jsParsedObj) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	EW.LogSystem.debug("XmlRpcBaseConn.prototype.successCallback");
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestCompleted(jsParsedObj);
    }	
};

/**
 * Called in case of error
 */
XmlRpcBaseConn.prototype.errorCallback = function (faultCode, faultString) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla
	
	EW.LogSystem.error("XmlRpcBaseConn.prototype.errorCallback");
	errorObj = {
	 	name: faultCode,
	 	message: faultString
	};

	if("undefined" == typeof faultCode) {
		errorObj.name ="0";
		errorObj.message = "Server did not return any results.";
	}
	
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestError(errorObj); 
    }		
};


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
};

/**
 * Called in case of error in the addition of a blog
 */
AddBlogConn.prototype.errorCallback = function (faultCode, faultString) {
	if(this.isStopped == true) return; //se è stata stoppata non fare nulla

	EW.LogSystem.error("AddBlogConn.prototype.errorCallback");

	errorObj = {
			name: faultCode,
			message: faultString
	};
	if("undefined" == typeof faultCode) {
		errorObj.name ="0";
		errorObj.message = "Server did not return any results. Make sure that the blog url is correct. Remove the www incase you are using it. <br /> <br /> <strong>TIP</strong>: You can go back and change the url.";
	}
	for(var i = 0; i < this.listeners.length; i++) {
		this.listeners[i].connRequestError(errorObj); 
	}		
};

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
};


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
	EW.LogSystem.debug("metaWeblog.newPost");
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
};


/**
 * New Media Connection
 */
function NewMedia(_username, _password, _url, _content) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.content = _content;
}

NewMedia.prototype =  new XmlRpcBaseConn;
NewMedia.prototype.execute = function () {
	try {
		var method = "metaWeblog.newMediaObject";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		request.addParam(this.content);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
};


/**
 * Get Comments Connection
 */
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
};
GetCommentsConn.prototype.setNumber = function (_number) {
	this.number = _number;
};
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
		};

		request.addParam(options);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
};


/**
 * Get Comments Count Connection
 */
function GetCommentCount(_username, _password, _url) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.post_id = -1;
};
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
};


/**
 * Delete Comment Connection
 */
function DeleteComment(_username, _password, _url, commentID) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.commentID = commentID;
};
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
};

/**
 * Edit Comment Connection
 */
function EditComment(_username, _password, _url, comment) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.comment = comment;
};
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
};


/**
 * Reply to Comment Connection
 */
function ReplyComment(_username, _password, _url, _post_id, _comment_reply) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.post_id = _post_id;
	this.comment_reply = _comment_reply;
};
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
};


/**
 * Get Comment Connection
 */
function GetComment(_username, _password, _url, _comment_id) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.comment_id = _comment_id;
};
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
};


/**
 * Get Posts Connection
 */
function GetPostsConn(_username, _password, _url) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.offset = 0;
	this.number = 10;
}
GetPostsConn.prototype =  new XmlRpcBaseConn;
GetPostsConn.prototype.setOffset = function (newOffset) {
	this.offset = newOffset;
};
GetPostsConn.prototype.setNumber = function (_number) {
	this.number = _number;
};
GetPostsConn.prototype.execute = function () {
	EW.LogSystem.debug("wp.getPosts");
	try {
		var method = "wp.getPosts";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		var filter = {
			 offset : this.offset,
			 number : this.number 
		};
		request.addParam(filter);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
};

//New category. See http://codex.wordpress.org/XML-RPC_WordPress_API/Categories_%26_Tags
function NewCategoryConn(_username, _password, _url, _categoryName) {
	this.base = XmlRpcBaseConn;
	this.base(_username, _password, _url);
	this.categoryName = _categoryName;
	this.description = null;
	this.parent_id = null;
}
NewCategoryConn.prototype =  new XmlRpcBaseConn;
NewCategoryConn.prototype.setParentCategory = function (_parent_id) {
	this.parent_id = _parent_id;
};
NewCategoryConn.prototype.setDescription = function (_desc) {
	this.description = _desc;
};
NewCategoryConn.prototype.execute = function () {
	EW.LogSystem.debug("wp.newCategory");
	try {
		var method = "wp.newCategory";
		var request = new XmlRpcRequest(this.url, method);
		request.addParam("1");
		request.addParam(this.username);
		request.addParam(this.password);
		var category = {
				name : this.categoryName
		};
		//set optional parameters
		if ( this.description !== null )
			category.description = this.description;
		if ( this.parent_id !== null )
			category.parent_id = this.parent_id;
		
		request.addParam(category);
		request.addListener(this);
		request.send();
	} catch (err) {
		EW.Utils.showErrorDialog ("Error", err);
	}
};