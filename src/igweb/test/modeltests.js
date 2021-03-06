
// These are for QUnit: http://docs.jquery.com/QUnit
(function(global, undefined) {

module("Model tests");
test('Stat tests', function () {

    var stat = new Stat();

    stat.baseValue = 17;
    equals(stat.getValue(), 17, "baseValue sets the value");
    var modOne = stat.addModifier(2);
    equals(stat.getValue(), 19, "modifier influences the value");
    var modTwo = stat.addModifier(5, 'foo');
    equals(stat.getValue(), 24, "foo modifier influences the value");
    var modThre = stat.addModifier(3, 'foo');
    equals(stat.getValue(), 24, "lower foo modifier does not influence the value");
    stat.removeModifier(modTwo);
    equals(stat.getValue(), 22, "removing the shadowing modifier");
    stat.baseValue = 0;
    equals(stat.getValue(), 5, "clearing baseValue and all is well");

    stat.textValue = 'Booga';
    equals(stat.getValue(), 'Booga', "textValue overrides the numeric");
    delete stat.textValue;
    equals(stat.getValue(), 5, "clearing textValue and all is well");

    var modFour = stat.addModifier(-10, 'bar');
    equals(stat.getValue(), -5, "negative modifiers work too");
    var modFive = stat.addModifier(-3, 'bar');
    equals(stat.getValue(), -5, "negative modifiers shadow properly");
    stat.removeModifier(modFour);
    equals(stat.getValue(), 2, "negative modifiers unshadow properly");

    var modSix = stat.addModifier(function () { return 3; });
    equals(stat.getValue(), 5, "function modifiers");

    stat.removeModifier(modThre);
    stat.removeModifier(modSix);
    stat.removeModifier(modOne);
    stat.removeModifier(modFive);

    equals(stat.getValue(), 0, "all cleans up OK");
});

test('Constant statadd', function() {
  expect(3);

  var element = new RulesElement({
    rules: function(model) {
      model.statadd('speed', 6);
    }
  });
       
  var model = new Model();
       
  equals(model.stat('speed'), 0, 'Speed before grant');
  model.grant(element);
  equals(model.stat('speed'), 6, 'Speed after grant');
  model.remove(element);
  equals(model.stat('speed'), 0, 'Speed after remove');
});


test('Text statadd', function() {
  expect(3);

  var element = new RulesElement({
    rules: function(model) {
      model.statadd('Size', 'Medium');
    }
  });

  var model = new Model();
       
  ok(!model.stat('Size'), 'Size should be undefined');
  model.grant(element);
  equals(model.stat('Size'), 'Medium', 'Size after grant');
  model.remove(element);
  ok(!model.stat('Size'), 'Size after remove should be undefined');
});

test('Function statadd', function() {
  expect(3);
       
  var element = new RulesElement({
    rules: function(model) {
      model.statadd('ToHit', function() { return 4; });
    }
  });
       
  var model = new Model();
       
  ok(!model.stat('ToHit'), 'Size should be undefined');
  model.grant(element);
  equals(model.stat('ToHit'), 4, 'Size after grant');
  model.remove(element);
  ok(!model.stat('ToHit'), 'Size after remove should be undefined');
});

test('Dependent statadd', function() {
  expect(8);
       
  var elementOne = new RulesElement({
    rules: function(model) {
      model.statadd('x', function() { return model.stat('y'); });
    }
  });

  var elementTwo = new RulesElement({
    rules: function(model) {
      model.statadd('y', 7);
    }
  });
       
  var model = new Model();
       
  equals(model.stat('x'), 0, "x before anything");
  equals(model.stat('y'), 0, "y before anything");
  model.grant(elementOne);
  equals(model.stat('x'), 0, "x after grant one");
  equals(model.stat('y'), 0, "y after grant one");
  model.grant(elementTwo);
  equals(model.stat('x'), 7, "x after grant two");
  equals(model.stat('y'), 7, "y after grant two");
  model.remove(elementTwo);
  equals(model.stat('x'), 0, "x after remove");
  equals(model.stat('y'), 0, "y after remove");
});

test('Transitive grants', function() {
       
  var elementOne = new RulesElement({
    rules: function(model) {
      model.grant(elementTwo);
    }
  });

  var elementTwo = new RulesElement({
    rules: function(model) {
      model.statadd('y', 7);
    }
  });
       
  var model = new Model();
       
  equals(model.stat('y'), 0, "y before anything");
  model.grant(elementOne);
  equals(model.stat('y'), 7, "y after grant");
  model.remove(elementOne);
  equals(model.stat('y'), 0, "y after remove");
});


module("Model Tests: Choice Tests", {
  setup: function() {
    var e;

    var elements = global.elements || (global.elements = {});
    var types = elements.types || (elements.types = {});
    var byID = elements.id || (elements.id = {});

    var T1 = types["T1"] || (types["T1"] = {});
    e = T1["Dwarf"] = new RulesElement({ 
        name: "Dwarf",
        categories: ['a', 'b'],
        rules: function(model) {
          model.statadd('X', 10);
        }
    });
    byID[e.id] = e;

    e = T1["Dragonborn"] = new RulesElement({ 
        name: "Dragonborn",
        categories: ['b', 'c'],
        rules: function(model) {
          model.statadd('X', 20);
        }
    });
    byID[e.id] = e;

    e = T1["Neverseen"] = new RulesElement({
      name: "Neverseen",
      categories: ['c', 'd'],
      prereqs: function(model) { return false; }
    });
    byID[e.id] = e;

    var T2 = types["T2"] || (types["T2"] = {});
    e = T2["A"] = new RulesElement({
      name: "foo",
      rules: function(model) {
          model.select('T3', 1);
        }
    });
    byID[e.id] = e;

    var T3 = types["T3"] || (types["T3"] = {});
    e = T3["A"] = new RulesElement({
        name: "bar",
        rules: function(model) {
          model.statadd('X', 10);
        }
    });
    byID[e.id] = e;

  },
  teardown: function() {
    delete global.elements.types["T1"];
    delete global.elements.types["T2"];
    delete global.elements.types["T3"];
  }
});

test('Basic choices', function() {

  var element = new RulesElement({
    rules: function(model) {
      model.select("T1", 1);
      model.select("T1", 1, {
        filter: function(model, element) { return element.hasCategory('c'); }
      });
    }
  });

  var model = new Model();
  model.grant(element);
  var choices = model.getChoices("T1");
  equals(choices.length, 2, "Number of choices for T1");
  var options = choices[0].getValidElements();
  equals(options.length, 2, "Number of valid elements (first choice)");
  equals(options[0].name, "Dwarf", "(1) First element name");
  equals(options[1].name, "Dragonborn", "(1) Second element name");
  
  options = choices[1].getValidElements();
  equals(options.length, 1, "Number of valid elements (second)");
  equals(options[0].name, "Dragonborn", "(2) Element name");

  var choice = choices[0];
  equals(model.stat('X'), 0, "X before choosing");
  choice.choice = elements.types["T1"]["Dwarf"];
  equals(model.stat('X'), 10, "X after choosing Dwarf");
  choice.choice = elements.types["T1"]["Dragonborn"];
  equals(model.stat('X'), 20, "X after choosing Dragonborn");
  choice.choice = null;
  equals(model.stat('X'), 0, "X after choosing nothing");

});

test('Removing a choice ungrants the selection', function() {

  var element = new RulesElement({
    rules: function(model) {
      model.select("T1", 1);
    }
  });

  var model = new Model();
  model.grant(element);

  var choices = model.getChoices("T1");
  equals(choices.length, 1, "Number of choices for T1");
  var choice = choices[0];
  var options = choice.getValidElements();
  equals(options.length, 2, "Number of valid elements");

  equals(model.stat('X'), 0, "X before choosing");
  choice.choice = options[0];
  equals(model.stat('X'), 10, "X after choosing Dwarf");

  model.remove(element);
  equals(model.stat('X'), 0, "X after removing initial element");
  equals(model.getChoices("T1").length, 0, "Number of choices for T1 after removing");
});

test('Transitive grant/ungrant with choices', function() {

  var element = new RulesElement({
    rules: function(model) {
      model.select("T2", 1);
    }
  });

  var model = new Model();
  equals(model.getChoices("T2").length, 0, "Number of T2 choices before grant");
  equals(model.getChoices("T3").length, 0, "Number of T3 choices before grant");
  equals(model.stat('X'), 0, "X before grant");

  model.grant(element);

  var choices1 = model.getChoices("T2");
  equals(choices1.length, 1, "Number of choices for T2");
  var choice1 = choices1[0];
  var options = choice1.getValidElements();
  equals(options.length, 1, "Number of valid elements for T2");

  equals(model.getChoices("T3").length, 0, "Number of T3 choices after initial grant");
  equals(model.stat('X'), 0, "X after initial grant");

  equals(options[0].name, "foo", "Name of T2 option");
  choice1.choice = options[0];

  var choices2 = model.getChoices("T3");
  equals(choices2.length, 1, "Number of choices for T3 after T2 choice");
  var choice2 = choices2[0];
  options = choice2.getValidElements();
  equals(options.length, 1, "Number of valid elements for T3");
       
  equals(model.stat('X'), 0, "X before choosing T3");

  equals(options[0].name, "bar", "Name of T3 option");
  choice2.choice = options[0];

  equals(model.stat('X'), 10, "X after choosing T3");

  model.remove(element);

  equals(model.getChoices("T2").length, 0, "Number of T2 choices after remove");
  equals(model.getChoices("T3").length, 0, "Number of T3 choices after remove");
  equals(model.stat('X'), 0, "X after remove");
});


})(this);