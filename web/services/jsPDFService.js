angular.module('rvServices')
  .factory('jsPDFService', jsPDFService);

jsPDFService.$inject = ['$window'];

function jsPDFService($window) {
  var doc;

  var constants = {
    BLACK: 'black',
    BOLD: 'bold',
    GOLD: 'gold',
    GRAY: 'gray',
    LARGE: 'large',
    LIGHT_GRAY: 'light_gray',
    NORMAL: 'normal',
    SMALL: 'small'
  };

  var sizes = {
    a4: {
      width: 595, // in pt
      height: 842
    },
    fontSize: {},
    indentSize: {},
    paddingSize: {},
    verticalSpacing: {}
  };
  sizes.fontSize[constants.NORMAL] = 12;
  sizes.fontSize[constants.LARGE] = 20;
  sizes.indentSize[constants.NORMAL] = 15;
  sizes.paddingSize[constants.NORMAL] = 6;
  sizes.verticalSpacing[constants.SMALL] = 15;
  sizes.verticalSpacing[constants.NORMAL] = 25;
  sizes.verticalSpacing[constants.LARGE] = 39;

  var colors = {};
  colors[constants.BLACK] = [0, 0, 0];
  colors[constants.GOLD] = [184, 159, 128];
  colors[constants.GRAY] = [136, 136, 136];
  colors[constants.LIGHT_GRAY] = [221, 221, 221];

  var startX,
    startY,
    curY,
    indentSize,
    paddingSize;

  var factory = {
    columns: columns,
    createTable: createTable,
    horizontalLine: horizontalLine,
    jsPDF: $window.jsPDF,
    newDoc: newDoc,
    newLine: newLine,
    reset: reset,
    save: save,
    text: text
  };

  return _.merge(factory, constants);

  function columns(columns) {
    var self = this;
    columns = columns || [];
    var colWidth = (sizes.a4.width-startX*2)/columns.length;
    columns.forEach(function(column, index) {
      self.text(column.text, column.writeOpts, colWidth*index+column.writeOpts.xOffset);
    });
    return self;
  }

  function createTable(columns, rows, writeOpts) {
    writeOpts = writeOpts || {};
    processWriteOpts(writeOpts);
    writeOpts = _.merge({
      theme: 'grid',
      headerStyles: {
        fontStyle: constants.BOLD,
        fillColor: colors[constants.GOLD]
      },
      bodyStyles: {
        textColor: colors[constants.GRAY]
      },
      margin: [curY, startX, 0, startX+indentSize],
      tableLineColor: colors[constants.LIGHT_GRAY]
    }, writeOpts);
    curY = doc.autoTable(columns, rows, writeOpts).autoTable.previous.finalY;
    return this;
  }

  function horizontalLine(writeOpts) {
    processWriteOpts(writeOpts).lines([[0,0], [sizes.a4.width-startX*2,0]], startX, curY);
    return this;
  }

  function newDoc() {
    reset();
    doc = new $window.jsPDF('p', 'pt');
    return this;
  }

  function newLine(verticalSpacing) {
    verticalSpacing = verticalSpacing || constants.NORMAL;
    curY += (angular.isString(verticalSpacing) ? sizes.verticalSpacing[verticalSpacing] : verticalSpacing);
    return this;
  }

  function processWriteOpts(opts) {
    opts = opts || {};
    doc.setFontSize(
      opts.size ? (angular.isString(opts.size) ? sizes.fontSize[opts.size] : opts.size) : sizes.fontSize[constants.NORMAL]
    );
    doc.setFontStyle(
      opts.style ? opts.style : constants.NORMAL
    );
    var color = colors[opts.color ? opts.color : constants.BLACK];
    doc.setTextColor(color[0], color[1], color[2]);
    indentSize = opts.indentSize ? (angular.isString(opts.indentSize) ? sizes.indentSize[opts.indentSize] : opts.indentSize) : 0;
    paddingSize = opts.paddingSize ? (angular.isString(opts.paddingSize) ? sizes.paddingSize[opts.paddingSize] : opts.paddingSize) : 0;
    return doc;
  }

  function reset() {
    startX = 29;
    startY = 43;
    curY = startY;
    indentSize = 0;
    paddingSize = 0;
  }

  function save(filename) {
    doc.save(filename);
    doc = undefined;
  }

  function text(text, writeOpts, xOffset, yOffset) {
    xOffset = xOffset || 0;
    yOffset = yOffset || 0;
    processWriteOpts(writeOpts).text(text+'', startX+indentSize+xOffset, curY+yOffset);
    return this;
  }
}