/*!
 *	使用说明：
 *  当父节点有position定位时其子节点不宜有拖动效果，除非只有wrap有position定位可改造。
 */
 
/*================jQuery滚轮事件================*/
(function(d){var b=["DOMMouseScroll","mousewheel"];if(d.event.fixHooks){for(var a=b.length;a;){d.event.fixHooks[b[--a]]=d.event.mouseHooks}}d.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var e=b.length;e;){this.addEventListener(b[--e],c,false)}}else{this.onmousewheel=c}},teardown:function(){if(this.removeEventListener){for(var e=b.length;e;){this.removeEventListener(b[--e],c,false)}}else{this.onmousewheel=null}}};d.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}});function c(j){var h=j||window.event,g=[].slice.call(arguments,1),k=0,i=true,f=0,e=0;j=d.event.fix(h);j.type="mousewheel";if(h.wheelDelta){k=h.wheelDelta/120}if(h.detail){k=-h.detail/3}e=k;if(h.axis!==undefined&&h.axis===h.HORIZONTAL_AXIS){e=0;f=-1*k}if(h.wheelDeltaY!==undefined){e=h.wheelDeltaY/120}if(h.wheelDeltaX!==undefined){f=-1*h.wheelDeltaX/120}g.unshift(j,k,f,e);return(d.event.dispatch||d.event.handle).apply(this,g)}})(jQuery);

/*================核心代码================*/
/** core code
 * 数据处理对象
 * 有关数据处理的方法都在这里定义
 */
function DataForOrgchartBS(aoConf, context){
	this.conf = aoConf;
	this.context = context;
	this.init();
}
DataForOrgchartBS.prototype = {
	define:function(){
		this.tempData = [];//临时备份
		this.tempPids = {};//当前参考父节点id集
		
		this.adapter = {};//数据结构适配
		this.formatedData = [];//处理后结果数据
		this.source;//原始数据
	},
	redefine:function(){
		this.tempData = [];//原始数据临时备份
		this.tempPids = {};//当前参考父节点id集

		this.formatedData = [];//处理后结果数据
		
		if(this.source){
			$.each(this.source, function(idx, v){
				v["used"] = false;
			})
		}
		return this;
	},
	init:function(){
		this.define();
		this.adaptDataFormat();
	},
	/** 
	 * 按节点等级水平分类子节点，返回一个新数组
	 * 格式：[{"[id]":[]}, {}]
	 */
	formatForRank:function(data){
		//this.addData(data, "rank");//备份数据
		
		this.tempData = data;
		this.tempPids = {};

		var pid = this.adapter.pid;
		var id = this.adapter.id;
		
		if(data.constructor == Array){
			/**备份原始数据，顺便找出根节点
			 * 根节点是没有父节点的，可以是0或其它
			*/
			//先找出所有节点的id
			var tempIds = {};
			for(var i in data){
				tempIds[data[i][id]] = true;
			}

			//区分子节点与根节点，根节点有可能有多个
			for(var i in data){
				var t = data[i];
				if(tempIds[t[pid]] && t[pid]!=t[id]){
					t.rtype = "sub";
				}else{
					t.rtype = "root";
					this.tempPids[t[pid]] = true;
				}				
			}

			/**
			 * 对数据进行水平分级
			 */
			var rank = this.formatedData.length;
			var fd = {};
			var tids = {};
			for(var i in data){
				var t = data[i];
				//根节点，不包括在临时备份里
				if(this.tempPids[t[pid]]){
					t.rank = rank;
					t.used = true;//has used
					tids[t[id]] = true;
					if(!fd[t[pid]]){
						fd[t[pid]] = [];
					}
					fd[t[pid]].push(t);
				}
			}
			this.formatedData[rank] = fd;
			this.tempPids = tids;
			
			this._traverseDataForRank();
			
		}

		return this.formatedData;
	},
	_traverseDataForRank:function(){
		var pid = this.adapter.pid;
		var id = this.adapter.id;
		
		var rank = this.formatedData.length;
		var fd = {};
			
		var tids = {};
		
		for(var i in this.tempData){
			var t = this.tempData[i];
			if(!t.used && this.tempPids[t[pid]]){
				t.rank = rank;
				t.used = true;
				tids[t[id]] = true;
				if(!fd[t[pid]]){
					fd[t[pid]] = [];
				}
				fd[t[pid]].push(t);
			}
		}
		//递归终点
		var isnull = false;
		for(var p in tids){
			isnull = p;
		}
		if(!isnull)return;
		
		this.formatedData[rank] = fd;
		this.tempPids = tids;

		arguments.callee.call(this);
		
		return;
	},
	//将添加数据并保留(不会有重复数据)
	addData:function(data, type){
		var id = this.adapter.id;
		var src = this.source;
		if(!type || type=="rank"){//默认为rank
			if(!src){
				src = [];
			}
			src = src.concat(data);
			var tempIds = {};
			for(var i=0; i<src.length; i++){
				src[i].used = false;
				//去重
				if(!tempIds[src[i][id]]){
					tempIds[src[i][id]] = true;
				}else{
					src.splice(i, 1);
					i--;
				}
			}
		}
		this.source = src;
	},
	//重构数据:层次结构的变化(当前节点id, 新父节点id)
	appendData:function(nid, npid){
		var id = this.adapter.id;
		var pid = this.adapter.pid;
		for(var p in this.source){
			if(this.source[p][id] == nid){
				this.source[p][pid] = npid;
				break;
			}
		}
	},
	//删除数据，包括其子元素
	deleteData:function(nid){
		if(!nid)return;
		this.searchDataGroup(nid, delCallback);
		function delCallback(i, source){
			source[i].del = 1;
		}
		var src = this.source;
		for(var i=0; i<src.length; i++){
			var t = src[i];
			if(t.del == 1){
				src.splice(i, 1);
				i--;
			}
		}
	},
	//查找数据
	searchData:function(nid){
		var id = this.adapter.id;
		for(var p in this.source){
			if(this.source[p][id] == nid){
				return this.source[p];
			}
		}
	},
	//查找数据及它的子节点，并提供查找后的操作
	searchDataGroup:function(nid, callback){
		var o = this.source;
		for(var i=0; i<o.length; i++){
			if(o[i] && o[i][this.adapter.id] == nid){
				this.tempData.push(o[i]);
				if(typeof callback == "function"){
					callback(i, this.source);
				}
				for(var j=0; j<o.length; j++){
					if(o[j] && o[j][this.adapter.pid] == nid){
						arguments.callee.call(this, o[j][this.adapter.id], callback);
					}
				}
			}
		}
		return this.tempData;
	},
	/** 数据结构适配器
	 */
	adaptDataFormat:function(){
		var fm = {};
		this.adapter = this.conf.adapter || {
			"id": fm["id"] || "id",
			"pid": fm["pid"] || "pid",
			"logo": fm["logo"] || "logo"
		}
	}
};

/** core code
 * 树状结构基类
 * 新建树结构基本结构并提供相关方法
 */
function CreateOrgchartBaseBS(aoConf, context){
	this.conf = aoConf;
	this.context = context;
	this.init();
}
CreateOrgchartBaseBS.prototype = {
	subunitTree:[
		'<td class="org_td" id="org_td_{id}" nid="{id}" rank="{r}">',//0
		'	<div class="org_group" id="org_group_{id}" nid="{id}"></div>',//1{content}
		'</td>'
	],
	subunitColumn:[
		'<tr class="org_tr org_tr_col"><td class="org_td org_td_col" id="org_td_{id}" nid="{id}" rank="{r}">',
		'	<div class="org_group org_group_col" id="org_group_{id}" nid="{id}"></div>',
		'</td></tr>'
	],
	define:function(){
		this.dom = {};
		this.data = {};
		this.html = {};
		
		this.dom.wrap = this.conf.wrap;
		this.data.source = this.conf.data;
		this.data.orgType = this.conf.orgType;
		this.data.tempOrgType = this.conf.orgType;
		
		this.onCreateGroupTreeCallback = this.conf.onCreateGroupTreeCallback;
		this.onCreateRankTreeCallback = this.conf.onCreateRankTreeCallback;
		this.onCreateAllTreeCallback = this.conf.onCreateAllTreeCallback;
		this.onStartCreateAllTreeCallback = this.conf.onStartCreateAllTreeCallback;
	},
	init:function(){
		this.define();
	},
	/**
	 * 根据传入的数据构造树并显示
	 * 任何一个元素的位置只和的父节点(可能不存在)相关
	 */
	createByRank:function(data, orgType){	
		var pid = this.context.DataObject.adapter.pid;
		var id = this.context.DataObject.adapter.id;
		//开始创建所有组数据节点前的回调方法
		if(typeof this.onStartCreateAllTreeCallback == "function"){
			//创建父节点后的节点
			this.onStartCreateAllTreeCallback(data);
		}
		
		this.data.tempOrgType = this.data.orgType;
		this.data.orgType = orgType || this.data.orgType;
		var isExec0 = false;
		for(var i in data){
			var o = data[i];
			var isExec1 = false;
			//如果父节点存在则插入，否则新建
			for(var p in o){
				var isExec2 = false;//创建动作标识，非0表示有创建动作发生
				for(var n in o[p]){
					var tp = o[p][n];
					if($("#org_td_" + tp[id]).length)continue;
					if(!isExec2){
						isExec2 = true;
					}
					if(!isExec1){
						isExec1 = true;
					}
					if(!isExec0){
						isExec0 = true;
					}
					var subunit = [];//克隆模板
					
					if(this.data.orgType == "column"){
						$.each(this.subunitColumn, function(idx, val){
							subunit.push(val);
						});
					}else{
						$.each(this.subunitTree, function(idx, val){
							subunit.push(val);
						});	
					}

					var pnode = $("#org_td_" + tp[pid]);
					var rank = pnode.attr("rank");

					subunit[0] = subunit[0].replace(/{id}/g, tp[id]);
					subunit[0] = subunit[0].replace(/{r}/g, rank === undefined ? 0 : (parseInt(rank) + 1));
					subunit[1] = subunit[1].replace(/{id}/g, tp[id]);
					var node = $(subunit.join(""));
					this.context.NodeObject.createHtmlContent(tp).appendTo(node.find("div.org_group"));
					
					this.buildNode(node, pnode);
				}
				
				//完成创建同层一组数据节点时的回调方法，返回组父节点
				if(typeof this.onCreateGroupTreeCallback == "function"){
					//创建父节点后的节点
					this.onCreateGroupTreeCallback($("#org_td_" + p), isExec2);
				}
			}
			//完成创建同层所有组数据节点时的回调方法
			if(typeof this.onCreateRankTreeCallback == "function"){
				//创建父节点后的节点
				this.onCreateRankTreeCallback(i, o, isExec1);
			}
		}
		//完成创建所有组数据节点时的回调方法
		if(typeof this.onCreateAllTreeCallback == "function"){
			//创建父节点后的节点
			this.onCreateAllTreeCallback(data, isExec0);
		}

		this.data.orgType = this.data.tempOrgType;
	},
	buildNode:function(node, pnode){
		if(this.data.orgType == "column"){
			this.buildNodeColumn(node, pnode);
		}else{
			this.buildNodeTree(node, pnode);
		}
	},
	//把节点组合到树结构中node, pnode都是同类标签节点(.org_td)
	buildNodeTree:function(node, pnode){
		var unit = $('<table cellspacing=0  cellpadding=0 class="org_table" type="tree"><tr class="org_tr"></tr></table>');
		//重建之前把node之前所在的table处理一下
		var prevTable = null;
		if(node.siblings("td.org_td").length == 0){//如果无兄弟节点
			prevTable = node.closest("table.org_table");
		}
		if(!pnode.length){//建根节点
			unit.find("tr.org_tr").append(node);
			this.dom.wrap.append(unit);
		}else{//建其它节点
			var snode = pnode.find("td.org_td:first");//子节点
			if(!snode.length){//还没有插入子节点
				if(pnode.find("table.org_table").length){
					unit = pnode.find("table.org_table");
				}
				unit.find("tr.org_tr").append(node);
				pnode.find("div.org_group:first").append(unit);
			}else{//已插入
				snode.closest("tr.org_tr").append(node);
			}
		}
		if(prevTable){
			//如果当前父节点不等于旧父节点
			if(node.closest("table.org_table")[0] !== prevTable[0]){
				prevTable.remove();
			}
		}
	},
	//把节点组合到树结构中node(.org_tr), pnode(.org_td)
	buildNodeColumn:function(node, pnode){
		var unit = $('<table cellspacing=0  cellpadding=0 class="org_table org_table_col" type="column"></table>');
		//重建之前把node之前所在的table处理一下
		var prevTable = null;
		if(node.siblings("tr.org_tr").length == 0){//如果无兄弟节点
			prevTable = node.closest("table.org_table");
		}
		if(!pnode.length){//建根节点
			unit.append(node);
			this.dom.wrap.append(unit);
		}else{//建其它节点
			var snode = pnode.find(".org_tr:first");//子节点
			if(!snode.length){//还没有插入子节点
				if(pnode.find("table.org_table").length){
					unit = pnode.find("table.org_table");
				}
				unit.append(node);
				pnode.find("div.org_group:first").append(unit);
			}else{//已插入
				snode.closest("table.org_table").append(node);
			}
		}
		if(prevTable){
			//如果当前父节点不等于旧父节点
			if(node.closest("table.org_table")[0] !== prevTable[0]){
				prevTable.remove();
			}
		}
	}
};

/** core code
 * 单个节点对象，与整体布局无关
 * 提供操作每个节点内容的相关方法
 */
function CreateOrgchartNodeBS(aoConf, context){
	this.conf = aoConf;
	this.context = context;
	this.init();
}
CreateOrgchartNodeBS.prototype = {
	define:function(){
		this.dom = {};
		this.data = {};
		this.html = {};
		
		this.dom.wrap = this.conf.wrap;
		this.data.source;
		this.data.orgType = this.conf.orgType;
		this.html.htmlContent = this.conf.htmlContent || [
		'<div class="org_node_c">节点内容</div>'
		];
		
		this.onStartMove = this.conf.onStartMove;
		this.onEndMove = this.conf.onEndMove;
		this.onAppendNodeWithData = this.conf.onAppendNodeWithData;
		this.onCancelOriginalPlaceholder = this.conf.onCancelOriginalPlaceholder;
		this.onDeleteNodeCallback = this.conf.onDeleteNodeCallback;
		this._createHtmlContent = this.conf.createHtmlContent;
		this._addEvent = this.conf.addEventToNode;
		this.isBindMoveOperation = this.conf.isBindMoveOperation;//是否添加移动事件
		this.isMoveOperation = this.conf.isMoveOperation;//是否允许移动(可以有移动事件)
		
	},
	init:function(){
		this.define();
		this.addDragEventToDoc();
	},
	//新建组织结构图个体
	createHtmlContent:function(data){
		if(typeof this._createHtmlContent == "function"){
			return this._createHtmlContent(data);
		}
		
		var node = $(this.html.htmlContent.join(""));
		this.addEvent(node);
		return node;
	},
	//给个体添加事件
	addEvent:function(item){
		var that = this;
		item.bind("mousedown", function(e){
			var self = $(this);

			//列式结构不支持拖动
			if(typeof that.isBindMoveOperation != "undefined" && !that.isBindMoveOperation()){
				return;
			}
			
			//移动相关信息通知到document
			var doc = $(document);
			var group = self.parents(".org_group").first();
			
			//通知document组织结构图移动标识
			if(typeof that.isMoveOperation != "undefined" && !that.isMoveOperation()){
				doc.data("orgmoveable", false);
				return;
			}else{
				doc.data("orgmoveable", true);
			};	
			doc.data("movenode", group);//移动元素
			doc.data("refnode", that.dom.wrap.find("div.org_node_c").not("#" + self.attr("id")));//与移动相关的元素
			doc.data("handlenode", self);//移动操作元素	
			doc.attr("issorgtartmove", 0);//元素是否开始移动			

			//预算相关元素的width\height\left\top等信息
			that.calAllNodeLayout("div.org_group,div.org_node_c");
			that.setOriginalPlaceholder(group);
			//保留移动元素（组）的默认样式
			that.reserveMoveNodeCss(group);
			//设置移动元素（组）的移动样式
			that.setMoveNodeCss(group);
			
			//fix wrap为position:relative时移动时位置有偏移的问题
			group.data("curOrgtd", group.closest(".org_td"));
			group.data("parOrgtd", group.closest(".org_tr").closest(".org_td"));
			group.appendTo(document.body);			
		});
		
		if(typeof this._addEvent == "function"){
			this._addEvent(item);
		}
	},
	//移动（拖动）事件委托在document上
	addDragEventToDoc:function(){
		var that = this;
		if(typeof this.isBindMoveOperation != "undefined" && !this.isBindMoveOperation())return;
		//拖动事件绑定在document上
		$(document).bind("mousedown", function(e){
			var self = $(this);
			if(self.data("orgmoveable") === true){
				var ex = e.pageX || 0; 
				var ey = e.pageY || 0; 	
				self.data("esx", ex);
				self.data("esy", ey);
				self.data("edx", 0);
				self.data("edy", 0);
			}
		}).bind("mousemove", function(e){
			var self = $(this);
			if(self.data("orgmoveable") === true){
				var ex = e.pageX || 0; 
				var ey = e.pageY || 0;
				self.data("enx", ex);
				self.data("eny", ey);
				self.data("edx", ex - self.data("esx"));
				self.data("edy", ey - self.data("esy"));
				var mNode = self.data("movenode");
				
				mNode.css({
					"left":mNode.data("layout").x + self.data("edx"),
					"top":mNode.data("layout").y + self.data("edy")
				});
				
				var handlenode = self.data("handlenode");
				var nx = handlenode.offset().left;
				var ny = handlenode.offset().top;
				var nw = handlenode.width();

				if(self.attr("issorgtartmove") != 1){
					self.attr("issorgtartmove", 1);
					mNode.css({
						"opacity":0.5
					});
					if(typeof that.onStartMove == "function"){
						that.onStartMove(handlenode);
					}
				}
				
				self.data("refnode").each(function(i, node){
					node = $(node);
					//fix wrap为position:relative时移动时位置有偏移的问题
					/*
					if($.contains(handlenode.closest(".org_td").get(0), node.get(0))){//如果目标元素与当前元素同组则不比较
						return true;
					}
					*/
					if(
					nx+nw/2 >= node.data("layout").x
					&& nx+nw/2 <= node.data("layout").x+node.data("layout").w
					&& ny >= node.data("layout").y
					&& ny <= node.data("layout").y+node.data("layout").h
					){
						node.css("opacity", 0.5);
						
						//当前元素是否匹配，配合matchnode使用
						node.attr("ismatch", 1);
						//记录已被匹配的元素，配个ismatch使用
						handlenode.data("matchnode", node);
						//that.setTargetPlaceholder(handlenode, node);
					}else{
						node.css("opacity", 1);
						node.attr("ismatch", 0);
					}
					return true;
				});
			}
		}).bind("mouseup", function(event){
			var self = $(this);
			if(self.data("orgmoveable") === true){
				var handlenode = self.data("handlenode");
				//恢复组元素样式
				var group = self.data("movenode");
				var a = group.data("css");
				group.css(group.data("css"));

				var w = group.width();
				var h = group.height();
				//group.hide();
				that.cancelOriginalPlaceholder();
				that.appendMoveNode(handlenode);

				//恢复目标样式
				if(handlenode.data("matchnode"))
				handlenode.data("matchnode").css("opacity", 1);
				
				self.data("movenode", null);
				self.data("orgmoveable", false);

				//fix wrap为position:relative时移动时位置有偏移的问题
				//var ohandleparent = handlenode.closest(".org_tr").closest(".org_td");
				var ohandleparent = group.data("parOrgtd");
				if(typeof that.onEndMove == "function"){
					that.onEndMove({
						"node":handlenode, 
						"oparent":ohandleparent
					});
				}
			}
		});
	},
	//计算相关元素布局信息
	calAllNodeLayout:function(selecttype){
		var pid = this.context.DataObject.adapter.pid;
		var id = this.context.DataObject.adapter.id;

		this.dom.wrap.data("layout", {
			"x":this.dom.wrap.offset().left, 
			"y":this.dom.wrap.offset().top,
			"w":this.dom.wrap.width(),
			"h":this.dom.wrap.height()
		});
		
		var nodes = $(selecttype);
		nodes.each(function(i, node){
			node = $(node);
			node.data("layout", {
				"x":node.offset().left, 
				"y":node.offset().top,
				"w":node.width(),
				"h":node.height()
			});
		});
	},
	//设置元素移动样式
	setMoveNodeCss:function(node){
		node.css({
			"position":"absolute",
			"left":node.data("layout").x,
			"top":node.data("layout").y,
			"z-index":999
		});
	},
	//设置元素原始占位元素(移动时)
	setOriginalPlaceholder:function(node){
		var ph = $("#orgplaceholder_o");
		if(!ph.length){
			$('<div id="orgplaceholder_o"></div>').appendTo(document.body);
			ph = $("#orgplaceholder_o");
		}
		ph.show().css({
			"width":node.width()-22,
			"height":node.height()-22,
			"margin":"10px",
			"border":"1px dashed #999",
			"border-radius":"5px"
		});
		ph.appendTo(node.parent());
	},
	//移除原始占位元素(取消移动时)
	cancelOriginalPlaceholder:function(){
		var ph = $("#orgplaceholder_o");
		if(this.onCancelOriginalPlaceholder == "function"){
			this.onCancelOriginalPlaceholder(ph);
			return;
		}
		ph.hide().appendTo(document.body);
	},
	//保留元素默认样式 
	reserveMoveNodeCss:function(node){
		node.data("css", {
			"position":node.css("absolute")||"static",
			"left":node.css("left"),
			"top":node.css("top"),
			"opacity":node.css("opacity"),
			"z-index":node.css("z-index")
		});
	},
	//把移动元素放入目标元素内
	appendMoveNode:function(moveNode){
		var target = moveNode.data("matchnode");
		//匹配的目标元素
		//fix wrap为position:relative时移动时位置有偏移的问题
		var group = moveNode.closest(".org_group");
		var node = group.data("curOrgtd");
		group.appendTo(node);
		if(target && target.length && target.attr("ismatch")==1){
			//把当前元素放在目标元素
			var pnode = target.closest(".org_td");
			//fix wrap为position:relative时移动时位置有偏移的问题
			//var node = moveNode.closest(".org_td");
			this.appendNodeWithData(node, pnode);
		}
	},
	//把移动元素移作目标元素子节点(当前节点，新父节点)，同时修改数据源
	appendNodeWithData:function(node, pnode){
		var oparent = node.closest(".org_tr").closest(".org_td");
	
		this.context.DataObject.appendData(node.attr("nid"), pnode.attr("nid"));
		this.context.BaseObject.buildNode(node, pnode);
		if(typeof this.onAppendNodeWithData == "function"){
			this.onAppendNodeWithData({
				"node":node, 
				"oparent":oparent
			});
		}
	},
	//删除节点，同时修改数据源
	deleteNodeWithData:function(nid){
		this.context.DataObject.deleteData(nid);
		var node = $("#org_td_"+nid);
		if(node.length){
			var ptable = node.closest(".org_table");
			var pnode = ptable.parents(".org_td:first");
			if(ptable.find(".org_td").length == 1){//仅有当前一个节点
				ptable.remove();
			}else{
				node.remove();
			}
			if(typeof this.onDeleteNodeCallback == "function"){
				this.onDeleteNodeCallback(pnode);
			}
		}

	},
	//添加节点(新添节点组数据)，同时修改数据源
	addNodeWithData:function(data){
		this.context.DataObject.addData(data);//添加数据
		var source = this.context.DataObject.redefine().formatForRank(data);//格式化数据
		this.context.BaseObject.createByRank(source);//建树
	}
};

/** core code
 * 组织架构图
 */
function CreateOrgchartBS(aoConf, context){
	this.conf = aoConf;
	this.context = context;
	//this.init();
}
CreateOrgchartBS.prototype = {
	init:function(){
		if(!this.conf.data || !this.conf.wrap || !this.conf.wrap.length){
			return;
		}	
		this.conf.wrap.html("");
	
		this.render();
	},
	render:function(){
		var that = this;

		this.COE = new CreateOrgchartExtendBS({}, this);
		
		var onStartMoveCallback = this.COE.onStartMoveCallback;
		var onEndMoveCallback = this.COE.onEndMoveCallback;
		var onAppendNodeWithData = this.COE.onAppendNodeWithData;
		var onCreateGroupTreeCallback = this.COE.onCreateGroupTreeCallback;
		var onCreateRankTreeCallback = this.COE.onCreateRankTreeCallback;
		var onCreateAllTreeCallback = this.COE.onCreateAllTreeCallback;
		var onStartCreateAllTreeCallback = this.COE.onStartCreateAllTreeCallback;
		var onCancelOriginalPlaceholder = this.COE.onCancelOriginalPlaceholder;
		var addEventToNode = this.COE.addEventToNode;
		var htmlContent = this.COE.htmlContent;
		var createHtmlContent = this.COE.createHtmlContent;
		var isMoveOperation = this.COE.isMoveOperation;
		var onDeleteNodeCallback = this.COE.onDeleteNodeCallback;

		var defaultOption = {
			"wrap":this.conf.wrap,//jQuery对象，整个结构容器
			"orgType":this.conf.orgType,//字符串，结构类型，默认tree(树型)，另一种column(列式)
			"onStartMove":onStartMoveCallback,//方法：拖动开始前执行方法，参数：触发移动操作的jQuery对象
			"onEndMove":onEndMoveCallback,//方法：拖动结束后执行方法，参数：{"node":[触发移动操作的jQuery对象],"oparent":[触发移动操作的jQuery对象的旧父节点org_td]}
			"htmlContent":htmlContent,//字符串或数据，节点内容模板
			"createHtmlContent":createHtmlContent,//方法，根据节点内容模板htmlContent构造html节点，参数：data当前内容节点数据{}
			"addEventToNode":addEventToNode,//方法，给html节点添加事件，参数：item当前内容节点对jQuery对象
			"onAppendNodeWithData":onAppendNodeWithData,//方法，当把节点从一个父节点移动到另一个父节点后，参数：{"node":[当前移动节点org_td],"oparent":[当前移动节点org_td的旧父节点org_td]}
			"onCancelOriginalPlaceholder":onCancelOriginalPlaceholder,//方法，移除移动时占位(虚线框)后的执行方法，参数：虚线框jQuery对象
			"onCreateGroupTreeCallback":onCreateGroupTreeCallback,//方法，创新完同级且同组节点后的执行方法，参数：当前组的父节点对像org_td,元素是否执行isExec
			"onCreateRankTreeCallback":onCreateRankTreeCallback,//方法，创建完同级节点后的执行方法，参数：i当前层级，o当前层级数据,元素是否执行isExec
			"onCreateAllTreeCallback":onCreateAllTreeCallback,//方法，创建完全部节点后的执行主法，参数：组织结构的所有数据,元素是否执行isExec
			"onStartCreateAllTreeCallback":onStartCreateAllTreeCallback,//方法，开始创建前的执行方法，参数：组织结构的所有数据
			"isMoveOperation":isMoveOperation,//方法，是否允许拖动节点操作，返回true or false生效
			"onDeleteNodeCallback":onDeleteNodeCallback
		};
		$.extend(true, defaultOption, this.conf);
		
		this.DataObject = new DataForOrgchartBS(defaultOption, this);
		this.NodeObject = new CreateOrgchartNodeBS(defaultOption, this);		
		this.BaseObject = new CreateOrgchartBaseBS(defaultOption, this);		
		this.NodeObject.addNodeWithData(this.conf.data);
	}
};

/*================非核心可扩展对象================*/
/**
 * 添加树连线
 */
function CreateOrgchartExtendBS(aoConf, context){
	this.context = context;
}
CreateOrgchartExtendBS.prototype = {
	htmlContent:[
	'<div class="org_node_c" id="org_node_c_{id}" nid="{id}"><div class="org_node_c_inner"><span style="position:absolute;color:#fff;background:#000"></span>',//0
	'	<a class="img_corg" href="#">',
	'		<img src="{img}" />',//2
	'	</a>',
	'</div></div>'
	],
	//当创建完一级组树后，cnode当前父节点
	onCreateGroupTreeCallback:function(cnode, isExec){
		if(!isExec)return;
		this.context.COE.setLine(cnode);
	},
	//当创建完一级树后，rank为当前树等级，data为当前数据
	onCreateRankTreeCallback:function(rank, data, isExec){
		if(!isExec)return;
	},
	//当创建完整个树组后，data为当前数据
	onCreateAllTreeCallback:function(data, isExec){
		var that = this;
		if(data.length === 0)return;
		var wrap = this.context.conf.wrap;
		if(!isExec){
			wrap.find("td.org_td").fadeIn(800);
			wrap.fadeIn(800);
			return;
		}			
		var id = this.context.DataObject.adapter.id;	

		var tWrap = wrap.find("table.org_table:first");//根节点table
		var allNodes;//需要设置缩放后大小的元素

		var scaleValue = wrap.data("scaleValue") || 0;
		for(var i in data[0]){
			if($("#org_td_" + i).length){
				for(var j in data[0][i]){
					var curNode = $("#org_td_" + data[0][i][j][id]);
					if(scaleValue !== 0){//如果组件被缩放过，则新元素需要重置
						allNodes = curNode.find("div.org_node_c, div.org_node_c_inner, div.org_node_c .img_corg img");
						allNodes.each(function(i, e){
							if(e){
								var eh = parseFloat(that.context.COE.getFinalStyle(e, "height")) + scaleValue;
								e.style.height = eh + "px";
								
								var ew = parseFloat(that.context.COE.getFinalStyle(e, "width")) + scaleValue;
								e.style.width = ew + "px";

							}
						});
					}
					curNode.fadeIn(800);
				}
			}else{
				wrap.fadeIn(800);
				break;
			}
		}	

		wrap.unbind("mousewheel");
		wrap.bind("mousewheel", function(event, delta){
			allNodes = wrap.find("div.org_node_c, div.org_node_c_inner, div.org_node_c .img_corg img");//所有需要设置缩放后大小的元素
			
			//变化前结构的大小位置
			var tiWid = tWrap.width();
			var tiHei = tWrap.height();
			var tiPos = tWrap.offset();
			//变化前鼠标相对tWrap的位置
			var imsL = event.pageX - tiPos.left;
			var imsT = event.pageY - tiPos.top;
			//变化前鼠标相对tWrap的比例位置
			irL = imsL / tiWid;
			irT = imsT / tiHei;
			
			//放大点
			var direct;
			if(delta < 0){//放大
				direct = -3;
			}else{
				direct = 3;
			}
			
			//保存当前缩放的值，为后续变化提供参考
			if(!wrap.data("scaleValue")){
				wrap.data("scaleValue", 0);
			}
			wrap.data("scaleValue", wrap.data("scaleValue") + direct);
			
			allNodes.each(function(i, e){
				if(e){
					var ew = parseFloat(that.context.COE.getFinalStyle(e, "width"));
					var eh = parseFloat(that.context.COE.getFinalStyle(e, "height"));	
					e.style.width = (ew + direct) + "px";
					e.style.height = (ew + direct) * (eh/ew) + "px";
				}
			});
			
			/**重新定位整个结构，以鼠标为中心缩放**/
			
			//变化后结构的大小
			var tfWid = tWrap.width();
			var tfHei = tWrap.height();
			//变化
			var disL = imsL - irL * tfWid;
			var disT = imsT - irT * tfHei;
			
			var iml = parseFloat(that.context.COE.getFinalStyle(tWrap[0], "marginLeft"));
			var ml = (isNaN(iml) ? 0 : iml) + disL;
			var imt = parseFloat(that.context.COE.getFinalStyle(tWrap[0], "marginTop"));
			var mt = (isNaN(imt) ? 0 : imt) + disT;

			tWrap.css({
				"margin-left" : ml,
				"margin-top" : mt
			});
			
			return false;
		});
	},
	//创建完整个树组前
	onStartCreateAllTreeCallback:function(data){
		if(data.length === 0)return;
		var id = this.context.DataObject.adapter.id;
		var wrap = this.context.conf.wrap;
		
		for(var i in data[0]){
			if($("#org_td_" + i).length){
				for(var j in data[0][i]){
					$("#org_td_" + data[0][i][j][id]).hide();
				}
			}else{
				wrap.hide();
				break;
			}
		}
	},
	//开始拖动前hook
	onStartMoveCallback:function(cnode){
		//fix wrap为position:relative时移动时位置有偏移的问题
		//var target = cnode.closest(".org_td");
		var target = cnode.closest(".org_group").data("curOrgtd");
		this.context.COE.setLine(target);
	},
	//拖动完成后hook
	onEndMoveCallback:function(res){
		var target = res.node.closest(".org_tr").closest(".org_td");
		target.fadeIn(500);
	},
	//元素被移动后
	onAppendNodeWithData:function(res){
		//fix wrap为position:relative时移动时位置有偏移的问题
		var target = res.node.closest(".org_tr").closest(".org_td");
		var ctarget = res.oparent;	
		target.hide();
		this.context.COE.setLine(target);
		this.context.COE.setLine(ctarget);
	},
	//元素被删除后
	onDeleteNodeCallback:function(pnode){
		this.context.COE.setLine(pnode);
	},
	//pnode(.org_td)
	setLine:function(pnode){
		//创建连接线
		if(pnode.length){
			var snode;
			if(this.context.BaseObject.data.orgType == "column"){
				snode = pnode.find(".org_table:first").find(".org_tr").children(".org_td");
			}else{
				snode = pnode.find(".org_tr:first").children(".org_td");
			}
			var len = snode.length;
			if(len){//有子节点
				pnode.find("div.org_node_c:first").addClass("org_line_bm");
				snode.each(function(i, e){
					e = $(e);
					e.removeClass("org_line_tm");
					e.removeClass("org_line_r");
					e.removeClass("org_line_l");
					e.removeClass("org_line_lr");
					if(len == 1){
						if(!e.hasClass("org_line_tm"))
						e.addClass("org_line_tm");
					}else if(i == 0){//第一个
						if(!e.hasClass("org_line_r"))
						e.addClass("org_line_r");
					}else if(i == len-1){//最后一个
						if(!e.hasClass("org_line_l"))
						e.addClass("org_line_l");
					}else{
						if(!e.hasClass("org_line_lr"))
						e.addClass("org_line_lr");
					}
				});
			}else{
				pnode.find("div.org_node_c:first").removeClass("org_line_bm");
			}
		}	
	},
	createHtmlContent:function(data){
		var node, tp = data;
		var pid = this.context.DataObject.adapter.pid;
		var id = this.context.DataObject.adapter.id;
		var logo = this.context.DataObject.adapter.logo;
		
		var content = [];//克隆模板
		$.each(this.html.htmlContent, function(idx, val){
			content.push(val);
		});
			
		content[0] = content[0].replace(/{id}/g, tp[id]);
		content[2] = content[2].replace("{img}", tp[logo]);
			
		node = $(content.join(""));
		node.find("span").html(tp[id]);
		
		this.addEvent(node);
		return node;
	},
	addEventToNode:function(item){
		var that = this;
		
		//阻止img标签的默认事件
		item.find("img").bind("mousemove", function(e){
			e.preventDefault();
		}).bind("mouseup", function(e){
			e.preventDefault();
		}).bind("mousedown", function(e){
			e.preventDefault();
		});
	},
	isMoveOperation:function(){
		var wrap = this.context.conf.wrap;
		if(wrap.find("table.org_table[type!=tree]").length)return false;
		else return true;
	},
	getFinalStyle:function (aeP, asName){
		if(aeP.style[asName]){
			return aeP.style[asName];
		}else if(aeP.currentStyle){
			return aeP.currentStyle[asName];
		}else if(document.defaultView && document.defaultView.getComputedStyle){
			asName = asName.replace(/([A-Z])/g, "-$1");
			asName = asName.toLowerCase();

			var s = document.defaultView.getComputedStyle(aeP, "");
			return s && s.getPropertyValue(asName);
		}else{
			return null;
		}

	}
}