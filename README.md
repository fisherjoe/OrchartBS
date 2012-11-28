OrchartBS
=========

OrchartBS组织架构图组件基本功能说明：

一、本组件实现了横向和纵向树形结构组织架构图。
二、可实现增加、删除、改变节点结构的功能。
三、可以拖动节点，改变节点结构。
四、可以配置扩展节点形态和样式。
五、通过鼠标滚轮可自由放大缩小。
六、拖动节点需要确保document上的mouse事件有效。

具体实例见源代码中的chart.html（完整示例）及chart-simple.html（基本示例）

核心代码：

window.CO = new CreateOrgchartBS($.extend({
	"data":data, //节点数据	
	"wrap":$("#box_org_tree") //架构图容器
}, DemoOption));
window.CO.init();

可配置参数：
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