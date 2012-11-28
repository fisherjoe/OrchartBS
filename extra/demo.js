function OrgchartDemo(){
	this.define();
	this.bindWrapEvent();
}
OrgchartDemo.prototype = {
	define:function(){
		this.isWrapDraggable = false;//总开关
		this.isWrapDraggableSub = true;//子开关
	},
	htmlContent:[
	'<div class="org_node_c small_ort_nci" id="org_node_c_{id}" nid="{id}"><div class="org_node_c_inner">',//0
	'	<div class="info_nci clearfix" style="display:none">',//1
	'		<a class="img_nci" href="#">',//2
	'			<img src="{img}" />',//3
	'		</a>',//4
	'		<div class="detail_nci">',//5
	'			<span class="name_nci">姓名：{name}</span>',//6
	'			<span class="part_nci">部门：技术部</span>',//7
	'		</div>',
	'	</div>',
	'	<div class="main_name_nci" style="display:block">',
	'		<table width="100%" height="100%" cellspacing="0" cellpadding="0">',
	'			<tr>',
	'				<td><a>{name}</a></td>',//13
	'			</tr>',
	'		</table>',
	'	</div>',
	'	<div class="ops_nci" style="display:none">',
	'		<a class="showall_nci">全部</a>',
	'		<a class="single_nci">独立</a>',
	'		<a class="unfold_nci">折叠</a>',
	'		<a class="fold_nci">展开</a>',
	'		<a class="switch_nci">切换</a>',
	'		<a class="edit_nci">编辑</a>',
	'	</div>',
	'</div></div>'
	],
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
						allNodes = curNode.find("div.org_node_c, div.org_node_c_inner");
						
						allNodes.each(function(i, e){
							if(e){
								var ew = parseFloat(that.context.COE.getFinalStyle(e, "width")) + scaleValue;
								e.style.width = ew + "px";
								e.style.height = ew * .5 + "px";

							}
						});
						
						window.Demo.changeNodeBySize(wrap, curNode);
					}
					
					curNode.find("td.org_td").not(function(){
						return !!$(this).find("table.org_table").length;
					}).find("a.unfold_nci, a.switch_nci").hide();
					if(curNode.parents("table[type=column]").length){
						allNodes.find("a.single_nci, a.unfold_nci, a.switch_nci").hide();
					}
					
					curNode.fadeIn(800);
				}
			}else{
				wrap.find("td.org_td").not(function(){
					return !!$(this).find("table.org_table").length;
				}).find("a.unfold_nci, a.switch_nci").hide();			
			
				wrap.fadeIn(800);
				break;
			}
		}

		var isIE6 = $.browser.msie && ($.browser.version == "6.0");
		wrap.unbind("mousewheel");
		wrap.bind("mousewheel", function(event, delta){
			allNodes = wrap.find("div.org_node_c, div.org_node_c_inner");//所有需要设置缩放后大小的元素
			
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
				direct = -5;
			}else{
				direct = +5;
			}
			
			//保存当前缩放的值，为后续变化提供参考
			if(!wrap.data("scaleValue")){
				wrap.data("scaleValue", 0);
			}
			wrap.data("scaleValue", wrap.data("scaleValue") + direct);

			if(!window.Demo.changeNodeBySize(wrap)){
				return false;
			};
			
			allNodes.each(function(i, e){
				if(e){
					var ew = parseFloat(that.context.COE.getFinalStyle(e, "width"));
					e.style.width = (ew + direct) + "px";
					e.style.height = (ew + direct) * .5 + "px";
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
	changeNodeBySize:function(wrap, container){
		if(!container){
			container = wrap;
		}
		var scaleValue = wrap.data("scaleValue");
		//如果宽度放大了90则切换视图
		if(scaleValue >= 90){
			container.find("div.org_node_c").removeClass("small_ort_nci");
			container.find("div.info_nci, div.ops_nci").show();
			container.find("div.main_name_nci").hide();
			
			wrap.data("scaleValue", 90);
			return false;
		}else if(scaleValue > 60){
			container.find("div.org_node_c").removeClass("small_ort_nci");
			container.find("div.info_nci").show();
			container.find("div.main_name_nci, div.ops_nci").hide();	
		}else if(scaleValue <= -30){
			container.find("div.org_node_c").addClass("small_ort_nci");
			container.find("div.info_nci, div.ops_nci").hide();
			container.find("div.main_name_nci").show();

			wrap.data("scaleValue", -30);
			return false;
		}else{
			container.find("div.org_node_c").addClass("small_ort_nci");
			container.find("div.info_nci, div.ops_nci").hide();
			container.find("div.main_name_nci").show();	
		}

		return true;
	},
	bindWrapEvent:function(){
		var handle = $("#box_org_tree");
		var moveNode;
		var mouseStartX, 
			mlStartX, 
			pointX, 
			mx, 
			mouseStartY, 
			mlStartY, 
			pointY, 
			my, 
			status;
		var dragCond = false;
		handle.bind("mousedown", function(e){
			dragCond = window.Demo.isWrapDraggable && window.Demo.isWrapDraggableSub;
			status = true;
			if(!dragCond)return;
			moveNode = $("#box_org_tree").find("table.org_table:first");
			if(e.pageX != undefined){
				mouseStartX = e.pageX;
			}	
			if(e.pageY != undefined){
				mouseStartY = e.pageY;
			}
			mlStartX = parseFloat(moveNode.css("margin-left"));
			mlStartX = isNaN(mlStartX) ? 0 : mlStartX;
			mlStartY = parseFloat(moveNode.css("margin-top"));
			mlStartY = isNaN(mlStartY) ? 0 : mlStartY;
		}).bind("mousemove", function(e){
			if(!dragCond)return;
			if(!status)return;
			if(e.pageX != undefined){
				pointX = e.pageX;
			}
			if(e.pageY != undefined){
				pointY = e.pageY;
			}
			mx = pointX - mouseStartX;
			my = pointY - mouseStartY;
			moveNode.css("margin-left", mlStartX + mx);
			moveNode.css("margin-top", mlStartY + my);
		}).bind("mouseup", function(){
			status = false;
			if(!dragCond)return;
		}).bind("mouseover", function(){
			dragCond = window.Demo.isWrapDraggable && window.Demo.isWrapDraggableSub;
			if(!dragCond){
				$(this).css("cursor", "default");
				return;
			}
			$(this).css("cursor", "move");
		}).bind("mouseout", function(){
			if(!dragCond)return;
			$(this).css("cursor", "default");
		});
		$(document).bind("mouseup", function(){
			status = false;
			if(!dragCond)return;
		});
	},
	createHtmlContent:function(data){
		var node, tp = data;
		var pid = this.context.DataObject.adapter.pid;
		var id = this.context.DataObject.adapter.id;
		var logo = this.context.DataObject.adapter.logo;
		var name = this.context.DataObject.adapter.name;
		
		var content = [];//克隆模板
		$.each(this.html.htmlContent, function(idx, val){
			content.push(val);
		});
			
		content[0] = content[0].replace(/{id}/g, tp[id]);
		content[3] = content[3].replace("{img}", tp[logo]);
		content[6] = content[6].replace("{name}", tp[name]);
		content[13] = content[13].replace("{name}", tp[name]);
			
		node = $(content.join(""));
		
		this.addEvent(node);
		return node;
	},
	addEventToNode:function(item){
		var that = this;
		var wrap = this.context.conf.wrap;
		var nid = item.attr("nid");
		
		item.bind("mouseover", function(){
			var self = $(this);
			window.Demo.isWrapDraggableSub = false;
			self.css("cursor", "move");
			self.find("div.org_node_c_inner").addClass("over_org_nci");
		}).bind("mouseout", function(){
			var self = $(this);
			window.Demo.isWrapDraggableSub = true;
			self.css("cursor", "default");
			self.find("div.org_node_c_inner").removeClass("over_org_nci");
		}).bind("mousemove", function(){
			window.Demo.isWrapDraggableSub = false;
		});
		
		item.find("a.edit_nci").bind("click", function(){
			alert("在这里你可以编辑用户所有信息\n包括基本信息修改、调岗操作等等");
		});
		
		//阻止img标签的默认事件
		item.find("img").bind("mousemove", function(e){
			e.preventDefault();
		}).bind("mouseup", function(e){
			e.preventDefault();
		}).bind("mousedown", function(e){
			e.preventDefault();
		});		

		//清除其它
		item.find("a.showall_nci").bind("click", function(){
			var self = $(this);
			var orgtd = $("#org_td_" + nid);
			wrap.find("div.org_node_c").filter(function(idx){
				if($(this).closest(orgtd).length !== 0){
					return false;
				}
				return true;
			}).css("visibility", "visible");
			wrap.find("td.org_td").filter(function(idx){
				if($.contains(orgtd[0], this)){
					return false;
				}
				return true;
			}).removeClass("nobackground");
			self.hide();
			item.find("a.single_nci").show();
		});
		item.find("a.single_nci").bind("click", function(){
			var self = $(this);
			var orgtd = $("#org_td_" + nid);
			wrap.find("div.org_node_c").filter(function(idx){
				if($(this).closest(orgtd).length !== 0){
					return false;
				}
				return true;
			}).css("visibility", "hidden");
			wrap.find("td.org_td").filter(function(idx){
				if($.contains(orgtd[0], this)){
					return false;
				}
				return true;
			}).addClass("nobackground");
			self.hide();
			item.find("a.showall_nci").show();
		});
		item.find("a.unfold_nci").bind("click", function(){
			var self = $(this);
			$("#org_td_" + nid).find("table.org_table:first").fadeOut("slow", function(){
				self.hide();
				item.find("a.fold_nci").show();
				if(!item.hasClass("org_line_tm")){
					item.addClass("org_line_tm");
				}
			});
		});
		item.find("a.fold_nci").bind("click", function(){
			var self = $(this);
			$("#org_td_" + nid).find("table.org_table:first").fadeIn("slow", function(){
				self.hide();
				item.find("a.unfold_nci").show();	
				if(item.hasClass("org_line_tm")){
					item.removeClass("org_line_tm");
				}
			});
		});
		item.find("a.switch_nci").bind("click", function(){
			var pid = nid;
			var schData = window.CO.DataObject.redefine().searchDataGroup(pid);
			var source = window.CO.DataObject.redefine().formatForRank(schData);//格式化数据

			var type;
			if($("#org_group_" + pid).length){
				var firstTable = $("#org_group_" + pid).find("table.org_table:first");
				type = firstTable.attr("type");
				firstTable.remove();
			}
			if(type === "tree"){
				type = "column";
			}else{
				type = "tree";
			}
			
			source.shift();
			window.CO.BaseObject.createByRank(source, type);//建树
			
			var pwrap = $("#org_td_" + pid);
			pwrap.removeClass("small_ort_nci");
			pwrap.find("div.info_nci, div.ops_nci").show();
			pwrap.find("div.main_name_nci").hide();
			
			if(type !== "column")return;
			var td = $("#org_td_" + pid);
			td.find("table.org_table:first").css({
				"border" : "1px dashed #666",
				"border-top" : "2px solid #666",
				"border-radius" : "5px"
			});
		});
	}	
};