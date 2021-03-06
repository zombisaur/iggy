﻿namespace cbimporter.Rules
{
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Xml.Linq;
    using System;
    using System.Diagnostics;
    using cbimporter.Model;

    public class RuleElement
    {
        readonly Identifier[] category;
        readonly HashSet<Identifier> boundCategories = new HashSet<Identifier>();
        readonly string description;
        readonly string flavor;
        readonly Identifier id;
        readonly Identifier name;
        readonly Identifier fullname;
        readonly string printPrereqs;
        readonly string[] preReqs;
        readonly List<Rule> rules = new List<Rule>();
        readonly string source;
        readonly Dictionary<string, string> specifics = new Dictionary<string, string>();
        readonly Identifier type;
        readonly XElement xml;

        public RuleElement(XElement element)
        {
            this.xml = element;
            this.fullname = Identifier.Get(element.Attribute(XNames.Name).Value + " " + element.Attribute(XNames.Type).Value);
            this.name = Identifier.Get(element.Attribute(XNames.Name).Value);
            this.type = Identifier.Get(element.Attribute(XNames.Type).Value);
            this.id = Identifier.Get(element.Attribute(XNames.InternalID).Value);

            XAttribute attribute = element.Attribute(XNames.Source);
            if (attribute != null)
            {
                this.source = element.Attribute(XNames.Source).Value;
            }

            string description = "";
            foreach (XNode node in element.Nodes())
            {
                if (node.NodeType == System.Xml.XmlNodeType.Element)
                {
                    var subElement = (XElement)node;
                    if (subElement.Name == XNames.Category)
                    {
                        string[] split = subElement.Value.Trim().Split(',');
                        this.category = new Identifier[split.Length];
                        for (int i = 0; i < split.Length; i++)
                        {
                            category[i] = Identifier.Get(split[i]);
                        }
                        
                    }
                    else if (subElement.Name == XNames.Specific)
                    {
                        this.specifics[subElement.Attribute(XNames.Name).Value] = subElement.Value;
                    }
                    else if (subElement.Name == XNames.Flavor)
                    {
                        this.flavor = subElement.Value;
                    }
                    else if (subElement.Name == XNames.PrintPrereqs)
                    {
                        this.printPrereqs = subElement.Value;
                    }
                    else if (subElement.Name == XNames.Prereqs)
                    {
                        this.preReqs = subElement.Value.Trim().Split(',');
                    }
                    else if (subElement.Name == XNames.Rules)
                    {
                        foreach (XElement ruleElement in subElement.Elements())
                        {
                            if (ruleElement.Name == XNames.Grant)
                            {
                                this.rules.Add(GrantRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.TextString)
                            {
                                this.rules.Add(TextStringRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.StatAdd)
                            {
                                this.rules.Add(StatAddRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.Select)
                            {
                                this.rules.Add(SelectRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.Replace)
                            {
                                this.rules.Add(ReplaceRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.Modify)
                            {
                                this.rules.Add(ModifyRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.Drop)
                            {
                                this.rules.Add(DropRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.Suggest)
                            {
                                this.rules.Add(SuggestRule.New(this, ruleElement));
                            }
                            else if (ruleElement.Name == XNames.StatAlias)
                            {
                                this.rules.Add(StatAliasRule.New(this, ruleElement));
                            }
                            else
                            {
                                throw new NotSupportedException("Unsupported rule name: " + ruleElement.Name.ToString());
                            }
                        }
                    }
                    else
                    {
                        throw new NotSupportedException("Unsupported element name: " + subElement.Name.ToString());
                    }
                }
                else if (node.NodeType == System.Xml.XmlNodeType.Text)
                {
                    description += node.ToString(SaveOptions.DisableFormatting);
                }
            }

            this.description = description.Trim();
        }

        public HashSet<Identifier> Categories { get { return this.boundCategories; } }
        public string Description { get { return this.description; } }
        public string Flavor { get { return this.flavor; } }
        public Identifier FullName { get { return this.fullname; } }
        public Identifier Id { get { return this.id; } }
        public Identifier Name { get { return this.name; } }
        public IList<Rule> Rules { get { return this.rules; } }
        public IDictionary<string, string> Specifics { get { return this.specifics; } }
        public Identifier Type { get { return this.type; } }
        public XElement Xml { get { return this.xml; } }

        public void Apply(Character character)
        {
            foreach (Rule rule in this.rules) { rule.Apply(character); }
        }

        public void BindCategories(RuleIndex index)
        {
            this.boundCategories.Add(this.name);
            this.boundCategories.Add(this.id);
            if (this.category != null)
            {
                for (int i = 0; i < this.category.Length; i++)
                {
                    this.boundCategories.Add(this.category[i]);

                    RuleElement category;
                    if (index.TryGetElement(this.category[i], out category))
                    {
                        this.boundCategories.Add(category.Name);
                    }
                }
            }
        }

        public void BindRules(RuleIndex index)
        {
            for (int i = 0; i < rules.Count; i++) { rules[i].Bind(index); }
        }

        public bool Grants(RuleElement element)
        {
            if (element == this) { return true; }
            foreach (GrantRule grantRule in this.rules.OfType<GrantRule>())
            {
                if (grantRule.Target.Grants(element)) { return true; }
            }
            return false;
        }

        public void Revoke(Character character)
        {
            foreach (Rule rule in this.rules) { rule.Revoke(character); }
        }

        public override string ToString()
        {
            return this.name.ToString() + " (" + this.type.ToString() + ")";
        }
    }
}
