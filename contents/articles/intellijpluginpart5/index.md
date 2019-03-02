---
title: IntelliJ Idea plugin . Part 5  - Prettyfying
author: pribluda
date: 2018-08-08
template: article.pug
tags: jetbrains, intellij, idea, plugin, java, module,facet,configuration, bnf, perser, lexer, jflex, pretty, formatting
lang: en
---

Every programming language has own needs for formatting to better reflect structure.   Oor grammar and syntax is somewhere 
in between of pascal, java and lisp with square brackets on top - so  standart formatter is doing  really poor job.   We 
need better one! Anyway -  tutroals of jetbrains are very scetchy on this topic so I will try to shine some light on it. 

<span class="more"/>


### Formatting and prettifying

At first we need some base classes and infrastructure:

#### LanguageCodeStyleSettingsProvider

This class thas to provide information for settings panel - norably code sample so users can see changes when they adjust them. 
As we do not provide more specific settings like "always lne break after open parenthesis" we can just subclass basis class and be fine with it.   

````java

public class MMTalkLanguageCodeStyleSettingsProvider extends LanguageCodeStyleSettingsProvider {

    private static final String SAMPLE = "        { berechne alles was wir brauchen}\n" +
            "        #[](\n" +
            "           $asset :=  object;\n" +
            "           $kurswert := $asset.assetKurswert;\n" +
            "           $performanceAnteil := $asset.AssetItem.is['Transaction'].if[$asset.AssetItem.PosPerformanceDev[1];0] * $fondsPerformanceAnteil;\n" +
            "           Trace('--------- fonds asset -----------');\n" +
            "           Trace($asset.AssetClassname;'Assetklasse');\n" +
            "           Trace($asset.AssetClassname;'Assetklasse');\n" +
            "           Trace($kurswert;'Kurswert');\n" +
            "           Trace($anteil;'Anteil');\n" +
            "           Trace($performanceAnteil;'Performance Anteil');\n" +
            "           Trace('--------- ende -----------');\n" +
            "           {name}\n" +
            "           $asset.MakeCollection.add[\"Assetklassname\";\n" +
            "                 if(AssetClassname  = \"Liquidität\";\"Fondsliquidität\";\n" +
            "                    if(\"Renten\" = AssetClassname;\n" +
            "                        \"Anleihen\";AssetClassname))]\n" +
            "                {Kurswert der Position, in unseren portfolio}\n" +
            "                .add['Kurswert';$kurswert * $faktor * $asset.weight]\n" +
            "                {anteil an der portfolio}\n" +
            "                .add['Anteil'; $kurswert * $faktor * $asset.weight/ $vermögen * 100]\n" +
            "                .add['PerformanceAnteil'; $performanceAnteil * 100 *$faktor]\n" +
            "                { marker für fondspositionen }\n" +
            "                .add['Fonds';true]\n" +
            "\n" +
            "        ).Map[$assets]";

    @NotNull
    @Override
    public Language getLanguage() {
        return MMTalkLanguage.INSTANCE;
    }

    @Nullable
    @Override
    public IndentOptionsEditor getIndentOptionsEditor() {
        return new SmartIndentOptionsEditor();
    }

    @Override
    public String getCodeSample(@NotNull SettingsType settingsType) {
        return SAMPLE;
    }


    @Nullable
    @Override
    public CommonCodeStyleSettings getDefaultCommonSettings() {
        CommonCodeStyleSettings commonSettings = new CommonCodeStyleSettings(MMTalkLanguage.INSTANCE);
        CommonCodeStyleSettings.IndentOptions indentOptions = commonSettings.initIndentOptions();
        indentOptions.INDENT_SIZE = 4;
        // strip all blank lines by default
        commonSettings.KEEP_BLANK_LINES_IN_CODE = 2;
        return commonSettings;
    }
}
````  

It is bound to our custom language instance,  and of course has to be registered as extension in **plugin.xml** (together with other coponents 
we will speak about later):

````xml

        <codeStyleSettingsProvider implementation="de.vwd.mmtalk.intellij.formatter.MMTalkCodeStyleSettingsProvider"/>
        <langCodeStyleSettingsProvider implementation="de.vwd.mmtalk.intellij.formatter.MMTalkLanguageCodeStyleSettingsProvider"/>
        <lang.formatter language="MMTalk" implementationClass="de.vwd.mmtalk.intellij.formatter.MMTalkFormattingBuildingModel"/>

````

#### codeStyleSettingsProvider


````java

public class MMTalkCodeStyleSettingsProvider  extends CodeStyleSettingsProvider {
    @NotNull
    @Override
    public Configurable createSettingsPage(CodeStyleSettings settings, CodeStyleSettings originalSettings) {
        return new CodeStyleAbstractConfigurable(settings, originalSettings, "MMTalk") {
            @Override
            protected CodeStyleAbstractPanel createPanel(CodeStyleSettings settings) {
                final Language language = MMTalkLanguage.INSTANCE;
                final CodeStyleSettings currentSettings = getCurrentSettings();
                return new TabbedLanguageCodeStylePanel(language, currentSettings, settings) {
                    @Override
                    protected void initTabs(CodeStyleSettings settings) {
                        addIndentOptionsTab(settings);
                        addSpacesTab(settings);
                        addBlankLinesTab(settings);
                        addWrappingAndBracesTab(settings);
                    }
                };
            }

            @Nullable
            @Override
            public String getHelpTopic() {
                return "reference.settingsdialog.codestyle.mmtalk";
            }
        };
    }

    @Nullable
    @Override
    public String getConfigurableDisplayName() {
        return MMTalkLanguage.INSTANCE.getDisplayName();
    }

    @Nullable
    @Override
    public CustomCodeStyleSettings createCustomSettings(CodeStyleSettings settings) {
        return new MMTalkCodeStyleSettings(settings);
    }
}
````

Is responsible for binding our language style settings provider to infrastructure

#### Formatter

Most interesting part, where all the stuff happens. It is responsible for creating spacing model and basic text blocks 
(which get indented). More about it in the next parts

* [Spacing model](../intellijpluginpart6)
