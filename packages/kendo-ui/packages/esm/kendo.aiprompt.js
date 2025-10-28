import './kendo.core.js';
import './kendo.data.js';
import './kendo.icons.js';
import './kendo.textarea.js';
import './kendo.button.js';
import './kendo.toolbar.js';
import './kendo.skeletoncontainer.js';
import './kendo.speechtotextbutton.js';
import './kendo.panelbar.js';
import './kendo.floatingactionbutton.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.data.odata.js';
import './kendo.data.xml.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import './kendo.floatinglabel.js';
import './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.badge.js';
import './kendo.html.button.js';
import './kendo.splitbutton.js';
import './kendo.button.menu.js';
import './kendo.popup.js';
import './kendo.dropdownbutton.js';
import './kendo.buttongroup.js';
import './kendo.togglebutton.js';
import './kendo.menu.js';
import '@progress/kendo-webspeech-common';
import './kendo.fx.js';

// Button management abstraction for AIPrompt views
(function($) {
    const messageTypes = {
        "ai": "assistant"};

    class AIPromptOutputActionManager {
        constructor(aiprompt, options = {}) {
            this.aiprompt = aiprompt;
            this.options = options;
            this.buttonDefinitions = this._createButtonDefinitions();
        }

        static getBuiltInActionDefinitions() {
            return {
                copy: {
                    command: "copy",
                    icon: "copy",
                    fillMode: "flat",
                    themeColor: "primary",
                    text: null
                },
                retry: {
                    command: "retry",
                    icon: "arrow-rotate-cw",
                    fillMode: "flat",
                    text: null
                },
                ratePositive: {
                    command: "ratePositive",
                    icon: "thumb-up-outline",
                    fillMode: "flat",
                    iconButton: true,
                    text: null
                },
                rateNegative: {
                    command: "rateNegative",
                    icon: "thumb-down-outline",
                    fillMode: "flat",
                    iconButton: true,
                    text: null
                },
                stop: {
                    command: "stop",
                    icon: "stop",
                    fillMode: "flat",
                    text: null
                }
            };
        }

        static processOutputActions(actions) {
            if (!actions) {
                return null;
            }

            const builtInActions = AIPromptOutputActionManager.getBuiltInActionDefinitions();

            return actions.map(action => {
                if (typeof action === "string") {
                    if (action === "rating") {
                        return [builtInActions.ratePositive, builtInActions.rateNegative];
                    } else if (action === "spacer") {
                        return { type: "spacer" };
                    }

                    return builtInActions[action] || { command: action, type: "button" };
                }
                if (kendo.isPresent(action.command) && action.command == "rating") {
                    return [builtInActions.ratePositive, builtInActions.rateNegative];
                }
                return action;
            }).flat();
        }

        _createButtonDefinitions() {
            const that = this;
            const baseDefinitions = AIPromptOutputActionManager.getBuiltInActionDefinitions();

            return {
                copy: {
                    ...baseDefinitions.copy,
                    getMessage: () => that.view.options.messages.copyOutput,
                    handler: (e, promptOutput) => that._handleCopyAction(e, promptOutput)
                },
                retry: {
                    ...baseDefinitions.retry,
                    getMessage: () => that.view.options.messages.retryGeneration,
                    handler: (e, promptOutput) => that._handleRetryAction(e, promptOutput)
                },
                ratePositive: {
                    ...baseDefinitions.ratePositive,
                    getMessage: () => that.view.options.messages.ratePositive,
                    handler: (e, promptOutput) => that._handleRatePositiveAction(e, promptOutput)
                },
                rateNegative: {
                    ...baseDefinitions.rateNegative,
                    getMessage: () => that.view.options.messages.rateNegative,
                    handler: (e, promptOutput) => that._handleRateNegativeAction(e, promptOutput)
                },
                stop: {
                    ...baseDefinitions.stop,
                    getMessage: () => that.view.options.messages.stopGeneration,
                    handler: (e, promptOutput) => that._handleStopAction(e, promptOutput)
                }
            };
        }

        initializeButtons(container, actions = null) {
            const that = this;

            if (actions) {
                actions.forEach(action => {
                    if (action.type === 'spacer') {
                        return;
                    }

                    const selector = `[data-action-command="${action.command}"]`;
                    that._initializeButton(container, selector, action);
                });
            }
        }

        _initializeButton(container, selector, action) {
            const that = this;
            const definition = that.buttonDefinitions[action.command];

            container.find(selector).kendoButton({
                icon: action.icon || definition?.icon,
                fillMode: action.fillMode || definition?.fillMode || "flat",
                themeColor: action.themeColor || definition?.themeColor || "base",
                rounded: action.rounded,
                click: function(e) {
                    const promptOutput = that.aiprompt.outputManager.getOutputFromElement(e.target);
                    const eventArgs = {
                        command: action.command,
                        outputId: promptOutput.id,
                        output: promptOutput.output || promptOutput.text || promptOutput || "",
                        prompt: promptOutput.prompt || "",
                        button: e.sender.element
                    };

                    if (definition?.handler && !that.aiprompt.trigger("outputAction", eventArgs)) {
                        definition.handler(e, promptOutput);
                    } else if (!definition) {
                        that.aiprompt.trigger("outputAction", eventArgs);
                    }
                }
            });
        }

        _handleCopyAction(e, promptOutput) {
            const hasCopyHandler = this.aiprompt._events && this.aiprompt._events.outputCopy && this.aiprompt._events.outputCopy.length > 0;

            if (hasCopyHandler) {
                kendo.logToConsole("The outputCopy event is deprecated. Use the outputAction event instead.", "warn");
            }

            const copyEventArgs = { output: promptOutput };
            if (hasCopyHandler && this.aiprompt.trigger("outputCopy", copyEventArgs)) {
                return;
            }

            if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                navigator.clipboard.writeText(promptOutput.output || promptOutput.text || promptOutput || "");
            }
        }

        _handleRetryAction(e, promptOutput) {
            const { prompt, output } = this.aiprompt.outputManager.extractOutputData(promptOutput);
            const that = this;
            const history = {
                role: messageTypes.ai,
                contents: [
                    {
                        $type: "text",
                        text: output
                    }
                ]
            };
            const retryEventArgs = {
                prompt: prompt,
                output: promptOutput,
                isRetry: true,
                history: [history]
            };

            const service = that.aiprompt?._selectedView?.service;

            if (service) {
                retryEventArgs.service = service;
            }

            if (that.aiprompt.trigger("promptRequest", retryEventArgs)) {
                return;
            }

            if (that.aiprompt?.options.service) {
                that.aiprompt?.transport?.read({
                    prompt: prompt,
                    history: retryEventArgs.history,
                    isRetry: true,
                    service: retryEventArgs.service
                });
            }
        }

        _handleRatePositiveAction(e, promptOutput) {
            const hasRatingChangeHandler = this.aiprompt._events && this.aiprompt._events.outputRating && this.aiprompt._events.outputRating.length > 0;

            if (hasRatingChangeHandler) {
                kendo.logToConsole("The outputRating event is deprecated. Use the outputAction event instead.", "warn");
            }

            this.aiprompt.trigger("outputRating", { rateType: "positive", output: promptOutput });

            kendo.ui.icon(e.sender.element.find(".k-icon"), "thumb-up");

            const negativeButton = $(e.target).siblings("[data-action-command='rateNegative'], [ref-rate-negative]");
            kendo.ui.icon(negativeButton.find(".k-icon"), "thumb-down-outline");
        }

        _handleRateNegativeAction(e, promptOutput) {
            const hasRatingChangeHandler = this.aiprompt._events && this.aiprompt._events.outputRating && this.aiprompt._events.outputRating.length > 0;

            if (hasRatingChangeHandler) {
                kendo.logToConsole("The outputRating event is deprecated. Use the outputAction event instead.", "warn");
            }

            this.aiprompt.trigger("outputRating", { rateType: "negative", output: promptOutput });

            kendo.ui.icon(e.sender.element.find(".k-icon"), "thumb-down");

            const positiveButton = $(e.target).siblings("[data-action-command='ratePositive'], [ref-rate-positive]");
            kendo.ui.icon(positiveButton.find(".k-icon"), "thumb-up-outline");
        }

        _handleStopAction(e, promptOutput) {
            this.aiprompt.trigger("promptRequestCancel", { output: promptOutput });

            $(e.target).siblings(".k-hidden").removeClass("k-hidden");
            $(e.target).addClass("k-hidden");
        }

        destroy() {
            this.aiprompt = null;
            this.options = null;
            this.buttonDefinitions = null;
        }
    }

    kendo.ui.AIPromptOutputActionManager = AIPromptOutputActionManager;

})(window.kendo.jQuery);

// Template management for AIPrompt views
(function($) {

    const CSS_CLASSES = {
        PROMPT_VIEW: "k-prompt-view",
        PROMPT_EXPANDER: "k-prompt-expander",
        SUGGESTION_GROUP: "k-suggestion-group",
        SUGGESTION: "k-suggestion",
        CARD: "k-card",
        CARD_LIST: "k-card-list",
        CARD_HEADER: "k-card-header",
        CARD_TITLE: "k-card-title",
        CARD_SUBTITLE: "k-card-subtitle",
        CARD_BODY: "k-card-body",
        CARD_ACTIONS: "k-card-actions",
        ACTIONS: "k-actions k-actions-start k-actions-horizontal",
        SPACER: "k-spacer"};

    const REFS = {
        PROMPT_INPUT: "ref-prompt-input",
        SUGGESTIONS_BUTTON: "ref-prompt-suggestions-button",
        GENERATE_BUTTON: "ref-generate-output-button",
        OUTPUT_BODY: "ref-output-body"};

    // Template builder class for consistent template generation
    class AIPromptTemplateBuilder {

        static createPromptView({ suggestions, promptSuggestionItemTemplate, messages }) {
            const suggestionsHtml = suggestions?.length ?
                AIPromptTemplateBuilder._createSuggestionsSection(suggestions, promptSuggestionItemTemplate, messages) : '';

            return `<div class="${CSS_CLASSES.PROMPT_VIEW}">
                <textarea ${REFS.PROMPT_INPUT}></textarea>
                ${suggestionsHtml}
            </div>`;
        }

        static createPromptFooter({ messages }) {
            return `<div class="${CSS_CLASSES.ACTIONS} k-prompt-actions">
                <button ${REFS.GENERATE_BUTTON}>${messages.generateOutput}</button>
            </div>`;
        }

        static createSuggestionItem({ suggestion }) {
            return `<span role="listitem" class="${CSS_CLASSES.SUGGESTION}">${suggestion}</span>`;
        }

        static createOutputCard({ output, showOutputRating, messages, showOutputSubtitleTooltip, encodedPromptOutputs, isStreaming, outputActions, outputTemplate }) {
            const contentHtml = AIPromptTemplateBuilder._generateContentHtml({
                output, outputTemplate, encodedPromptOutputs
            });

            const actionsHtml = AIPromptTemplateBuilder._generateActionsHtml({
                outputActions, showOutputRating, messages, isStreaming
            });
            const dataIdAttr = output.id ? ` data-id="${output.id}"` : '';
            return `<div role="listitem" tabindex="0" class="${CSS_CLASSES.CARD}"${dataIdAttr}>
                ${output.skipHeader ? '' : AIPromptTemplateBuilder._createCardHeader(output, messages, showOutputSubtitleTooltip)}
                ${output.skipBody ? '' : AIPromptTemplateBuilder._createCardBody(contentHtml, output.isLoading)}
                ${output.skipActions ? '' : actionsHtml}
            </div>`;
        }

        static createOutputView({ promptOutputs, showOutputRating, messages, showOutputSubtitleTooltip, encodedPromptOutputs, outputActions, outputTemplate }) {
            const cardsHtml = promptOutputs ?
                promptOutputs.map(output =>
                    AIPromptTemplateBuilder.createOutputCard({
                        output, showOutputRating, messages, showOutputSubtitleTooltip,
                        encodedPromptOutputs, outputActions, outputTemplate
                    })
                ).join("") : '';

            return `<div class="${CSS_CLASSES.PROMPT_VIEW}">
                <div role="list" class="${CSS_CLASSES.CARD_LIST}">
                    ${cardsHtml}
                </div>
            </div>`;
        }

        // Private helper methods
        static _createSuggestionsSection(suggestions, promptSuggestionItemTemplate, messages) {
            const suggestionItems = suggestions
                .map(suggestion => promptSuggestionItemTemplate({ suggestion }))
                .join("");

            return `<div class="${CSS_CLASSES.PROMPT_EXPANDER}">
                <button ${REFS.SUGGESTIONS_BUTTON} aria-expanded="true">${messages.promptSuggestions}</button>
                <div class="k-prompt-expander-content" role="list">
                    <div class="${CSS_CLASSES.SUGGESTION_GROUP}">
                        ${suggestionItems}
                    </div>
                </div>
            </div>`;
        }

        static _createCardHeader(output, messages, showOutputSubtitleTooltip) {
            const tooltipAttr = showOutputSubtitleTooltip ?
                `title="${kendo.htmlEncode(output.prompt)}"` : "";

            return `<div class="${CSS_CLASSES.CARD_HEADER}">
                <div class="${CSS_CLASSES.CARD_TITLE}">${messages.outputTitle}</div>
                <div class="${CSS_CLASSES.CARD_SUBTITLE}" ${tooltipAttr}>${kendo.htmlEncode(output.prompt)}</div>
            </div>`;
        }

        static _createCardBody(contentHtml, isLoading) {
            return `<div class="${CSS_CLASSES.CARD_BODY}" ${REFS.OUTPUT_BODY}>
                ${contentHtml}
            </div>`;
        }

        static _generateContentHtml({ output, outputTemplate, encodedPromptOutputs }) {
            if (outputTemplate && typeof outputTemplate === 'function' &&
                !output.isLoading && output.output) {
                return outputTemplate({ output: output, content: output.output });
            }

            const content = output.output || '';
            const loadingAttr = output.isLoading ? ' data-loading="true"' : ' data-loading="false"';
            return `<p ref-output-content${loadingAttr}>${encodedPromptOutputs ? kendo.htmlEncode(content) : content}</p>`;
        }

        static _generateActionsHtml({ outputActions, showOutputRating, messages, isStreaming }) {
            // outputActions should always be defined due to component defaults,
            // but provide fallback for safety
            if (!outputActions) {
                outputActions = showOutputRating ?
                    ["copy", "retry", "spacer", "rating"] :
                    ["copy", "retry"];
            }

            return AIPromptTemplateBuilder._createCustomActions(outputActions, showOutputRating, messages, isStreaming);
        }

        static _createCustomActions(outputActions, showOutputRating, messages, isStreaming) {
            const filteredActions = outputActions.filter(action => action.command !== 'stop');

            // Check if rating buttons are already included in the actions
            const hasRatingButtons = filteredActions.some(action =>
                action.command === 'ratePositive' || action.command === 'rateNegative'
            );

            // If showOutputRating is true and rating buttons aren't already included, add them with a spacer
            let actionsToRender = [...filteredActions];
            if (showOutputRating && !hasRatingButtons) {
                // Check if there's already a spacer, if not add one
                const hasExistingSpacer = actionsToRender.some(action => action.type === 'spacer');
                if (!hasExistingSpacer) {
                    actionsToRender.push({ type: 'spacer' });
                }

                // Add rating buttons
                actionsToRender.push(
                    { command: 'ratePositive', text: messages.ratePositive, type: 'button' },
                    { command: 'rateNegative', text: messages.rateNegative, type: 'button' }
                );
            }

            const actionsHtml = actionsToRender
                .map(action => AIPromptTemplateBuilder._createActionButton(action, messages, isStreaming))
                .join('');

            return `<div class="${CSS_CLASSES.ACTIONS} ${CSS_CLASSES.CARD_ACTIONS}">
                ${actionsHtml}
            </div>`;
        }

        static _createActionButton(action, messages, isStreaming) {
            if (action.type === 'spacer') {
                return `<span class="${CSS_CLASSES.SPACER}"></span>`;
            }

            const text = action.text || AIPromptTemplateBuilder._getActionText(action.command, messages);
            const title = action.title || text;

            return `<button data-action-command="${action.command}" title="${title}">${action.iconButton ? "" : text}</button>`;
        }

        static _getActionText(command, messages) {
            const textMap = {
                'copy': messages.copyOutput,
                'retry': messages.retryGeneration,
                'ratePositive': messages.ratePositive,
                'rateNegative': messages.rateNegative
            };

            return textMap[command] || command;
        }
    }

    // Expose to kendo namespace
    kendo.ui.AIPromptTemplateBuilder = AIPromptTemplateBuilder;

})(window.kendo.jQuery);

// Speech-to-text management for AIPrompt
(function($) {

    class AIPromptSpeechManager {
        constructor(view, options = {}) {
            this.view = view;
            this.aiprompt = view.aiprompt;
            this.options = this._processSettings(options);
            this._speechButton = null;
        }

        _processSettings(speechToTextConfig) {
            const defaultOptions = {
                integrationMode: "webSpeech",
                lang: 'en-US',
                continuous: false,
                interimResults: false,
                maxAlternatives: 1
            };

            if (speechToTextConfig === false || speechToTextConfig === null) {
                return { enabled: false, options: null };
            } else if (speechToTextConfig === true) {
                return { enabled: true, options: defaultOptions };
            } else if (typeof speechToTextConfig === 'object') {
                return {
                    enabled: true,
                    options: $.extend({}, defaultOptions, speechToTextConfig)
                };
            }

            return { enabled: true, options: defaultOptions };
        }

        isEnabled() {
            return this.options.enabled;
        }

        getTextAreaSuffixOptions() {
            if (!this.isEnabled()) {
                return {};
            }

            return {
                suffixOptions: {
                    template: function() {
                        return '<button ref-speech-to-text-button title="Speech to Text"></button>';
                    },
                    separator: false,
                }
            };
        }

        initialize(textareaWidget) {
            if (!this.isEnabled() || !textareaWidget) {
                return false;
            }

            const speechButton = textareaWidget.wrapper.find("button[ref-speech-to-text-button]");
            if (speechButton.length === 0) {
                return false;
            }

            this._speechButton = speechButton.kendoSpeechToTextButton({
                ...this.options.options,
                fillMode: "flat"
            }).getKendoSpeechToTextButton();

            this._speechButton.bind("result", (e) => this._handleResult(e, textareaWidget));
            this.aiprompt.speechToTextButton = this._speechButton;
            return true;
        }

        _handleResult(e, textareaWidget) {
            if (e.isFinal || !this.options.options.interimResults) {
                const transcript = e.alternatives[0]?.transcript || '';
                const currentValue = textareaWidget.value();
                let newValue = currentValue ? currentValue + ' ' + transcript : transcript;
                const maxLength = textareaWidget.options.maxlength;

                if (maxLength && newValue.length > maxLength) {
                    newValue = newValue.substring(0, maxLength);
                }

                textareaWidget.value(newValue);
            }
        }

        startRecognition() {
            if (this._speechButton) {
                this._speechButton.startRecognition();
            }
        }

        stopRecognition() {
            if (this._speechButton) {
                this._speechButton.stopRecognition();
            }
        }

        abortRecognition() {
            if (this._speechButton) {
                this._speechButton.abortRecognition();
            }
        }

        isListening() {
            return this._speechButton ? this._speechButton.isListening() : false;
        }

        destroy() {
            if (this._speechButton) {
                this._speechButton.destroy();
                this._speechButton = null;
            }
        }
    }

    // Expose to kendo namespace
    kendo.ui.AIPromptSpeechManager = AIPromptSpeechManager;

})(window.kendo.jQuery);

// Output management abstraction for AIPrompt components
(function($) {

    class AIPromptOutputObject {
        constructor(outputData, outputManager) {
            this.id = outputData.id;
            this.data = outputData;
            this._element = null;
            this._bodyElement = null;
            this._aiprompt = outputManager.aiprompt;
            this._isLoading = outputData.isLoading || false;
        }

        get isLoading() {
            return this._isLoading;
        }

                set isLoading(value) {
            const wasLoading = this._isLoading;
            this._isLoading = value;

            this.data.isLoading = value;

            if (value === true) {
                this.showSkeleton();
            } else if (value === false) {
                this.hideSkeleton();

                if (wasLoading || this.data.output) {
                    this.applyFinalTemplate();
                }
            }
        }

        getElement() {
            return this._element;
        }

        setElement(element) {
            this._element = element;
            return this;
        }

        updateContent(newContent) {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            this.data.content = newContent;
            this.data.output = newContent;

            const bodyElement = this._element.find('.k-card-body');
            const contentElement = bodyElement.find('[ref-output-content]');

            if (newContent && newContent.trim() && contentElement.length > 0) {
                bodyElement.find('.k-skeleton').remove();

                contentElement.attr('data-loading', 'false').show();
                const encodedPromptOutputs = this._aiprompt.options.encodedPromptOutputs;
                contentElement.html(encodedPromptOutputs ? kendo.htmlEncode(newContent) : newContent);
            }

            return this;
        }

        showSkeleton() {
            this.showHeaderSkeleton();
            this.showBodySkeleton();
            this.showActionSkeleton();
            return this;
        }

        hideSkeleton() {
            this.hideHeaderSkeleton();
            this.hideBodySkeleton();
            this.hideActionSkeleton();
            return this;
        }

        applyFinalTemplate() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const bodyElement = this._element.find('.k-card-body');
            const contentElement = bodyElement.find('[ref-output-content]');

            let outputTemplate = this._aiprompt?.options?.outputTemplate;
            if (!outputTemplate) {
                return this;
            } else if (typeof outputTemplate === 'string') {
                outputTemplate = kendo.template(outputTemplate);
            }

            if (outputTemplate && typeof outputTemplate === 'function' && this.data.output) {
                const customContent = outputTemplate({ output: this.data, content: this.data.output });
                bodyElement.html(customContent);
            } else if (contentElement.length > 0) {
                contentElement.attr('data-loading', 'false').show();
            }

            return this;
        }

        showHeaderSkeleton() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const headerElement = this._element.find('.k-card-header');
            if (headerElement.length === 0) {
                return this;
            }

            // Optionally hide header content if needed
            headerElement.children().hide();

            if (headerElement.find('.k-skeleton').length === 0) {
                const skeleton = $(`<span class="k-skeleton k-skeleton-text k-skeleton-pulse"></span>`);
                skeleton.css('width', '60%').css('height', '24px');
                headerElement.prepend(skeleton);
            }

            return this;
        }

        hideHeaderSkeleton() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const headerElement = this._element.find('.k-card-header');
            if (headerElement.length === 0) {
                return this;
            }

            headerElement.find('.k-skeleton').remove();
            headerElement.children().removeClass("k-hidden").show();

            return this;
        }

        showBodySkeleton() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const bodyElement = this._element.find('.k-card-body');
            const contentElement = bodyElement.find('[ref-output-content]');

            contentElement.attr('data-loading', 'true').hide();

            if (bodyElement.find('.k-skeleton').length === 0) {
                const skeleton = $(`<span class="k-skeleton k-skeleton-rect k-skeleton-pulse"></span>`);
                skeleton.css('height', '80px');
                bodyElement.prepend(skeleton);
            }

            return this;
        }

        hideBodySkeleton() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const bodyElement = this._element.find('.k-card-body');

            bodyElement.find('.k-skeleton').remove();

            this.applyFinalTemplate();

            return this;
        }

        showActionSkeleton() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const actionsElement = this._element.find('.k-card-actions');

            if (actionsElement.length > 0) {
                actionsElement.children().hide();

                if (actionsElement.find('.k-skeleton').length === 0) {
                    const skeleton = $(`<span class="k-skeleton k-skeleton-text k-skeleton-pulse"></span>`);
                    skeleton.css('width', '100%').css('height', '32px');
                    actionsElement.prepend(skeleton);
                }
            }

            return this;
        }

        hideActionSkeleton() {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            const actionsElement = this._element.find('.k-card-actions');

            if (actionsElement.length > 0) {
                actionsElement.find('.k-skeleton').remove();

                actionsElement.children().removeClass("k-hidden").show();
            }

            return this;
        }

        toggleActionButtons(isStreaming, outputActions) {
            if (!this._element || this._element.length === 0) {
                return this;
            }

            if (outputActions) {
                // For custom output actions - hide all buttons during streaming
                const allActions = this._element.find('[data-action-command]');

                if (isStreaming) {
                    allActions.addClass('k-hidden');
                } else {
                    allActions.removeClass('k-hidden');
                }
            } else {
                // For legacy ref-based buttons - hide all except rating buttons during streaming
                const actionButtons = this._element.find('[ref-copy-button], [ref-retry-button]');

                if (isStreaming) {
                    actionButtons.addClass('k-hidden');
                } else {
                    actionButtons.removeClass('k-hidden');
                }
            }

            return this;
        }

        destroy() {
            this._element = null;
            this._bodyElement = null;
            this._aiprompt = null;
            this.data = null;
            this.id = null;
            this._isLoading = false;
        }
    }

    class AIPromptOutputManager {
        constructor(aiprompt) {
            this.aiprompt = aiprompt;
        }

        createOutputObject(outputData) {
            return new AIPromptOutputObject(outputData, this);
        }

        getLastOutputObject() {
            if (this.aiprompt.promptOutputs.length > 0) {
                const lastOutput = this.aiprompt.promptOutputs[0]; // First element is the most recent
                return this.aiprompt.outputObjects.get(lastOutput.id);
            }
            return null;
        }

        // Enhanced method that handles parameter flexibility like the main AIPrompt component
        updatePromptOutputContent(content, outputId) {
            let outputObj;

            if (outputId) {
                outputObj = this.aiprompt.outputObjects.get(outputId);
            } else {
                outputObj = this.getLastOutputObject();
            }

            if (outputObj) {
                // Call the output object's updateContent method directly
                outputObj.updateContent(content);
                return outputObj; // Return the updated object for chaining
            } else {
                // No output object found
                return null;
            }
        }

        // Stop loading state for the most recent output
        stopLoading(objectId) {
            let outputObj = this.aiprompt.outputObjects.get(objectId);
            if (outputObj) {
                outputObj.isLoading = false; // This will automatically call hideSkeleton()
            } else {
                outputObj = this.getLastOutputObject();
                if (outputObj) {
                    outputObj.isLoading = false; // This will automatically call hideSkeleton()
                }
            }
        }

        stopAllLoading() {
            this.aiprompt.outputObjects.forEach(outputObj => {
                outputObj.isLoading = false;
            });
        }

        getOutputFromElement(element) {
            let card = $(element).closest(".k-card");
            let id = card.data("id");

            let promptOutput = this.aiprompt.promptOutputs.find(output => output.id == id);

            if (!promptOutput && this.aiprompt.outputObjects) {
                promptOutput = this.aiprompt.outputObjects.get(id);
            }

            return promptOutput;
        }

        extractOutputData(promptOutput) {
            if (!promptOutput) {
                return { prompt: null, output: null };
            }

            if (promptOutput.data) {
                return {
                    prompt: promptOutput.data.prompt,
                    output: promptOutput.data.output
                };
            }

            return {
                prompt: promptOutput.prompt,
                output: promptOutput.output
            };
        }

        destroy() {
            if (this.aiprompt && this.aiprompt.outputObjects) {
                this.aiprompt.outputObjects.forEach(outputObj => {
                    if (outputObj) {
                        outputObj._element = null;
                        outputObj._bodyElement = null;
                        outputObj._aiprompt = null;
                        outputObj.data = null;
                    }
                });
                this.aiprompt.outputObjects.clear();
            }

            this.aiprompt = null;
        }
    }

    kendo.ui.AIPromptOutputObject = AIPromptOutputObject;
    kendo.ui.AIPromptOutputManager = AIPromptOutputManager;

})(window.kendo.jQuery);

(function($) {
    let Widget = kendo.ui.Widget;
    const messageTypes = {
        "user": "user"};

    const KDISABLED = "k-disabled";
    const CSS_CLASSES = {
        PROMPT_EXPANDER: "k-prompt-expander",
        SUGGESTION_GROUP: "k-suggestion-group",
        SUGGESTION: "k-suggestion"};

    const REFERENCE_ATTRIBUTES = {
        PROMPT_SUGGESTIONS_BUTTON: "ref-prompt-suggestions-button",
        PROMPT_INPUT: "ref-prompt-input",
        GENERATE_OUTPUT_BUTTON: "ref-generate-output-button"};

    let AIPromptBaseView = kendo.ui.AIPromptBaseView = Widget.extend({
        init: function(element, options) {
            let that = this;

            Widget.fn.init.call(that, element, options);

            that.aiprompt = element.getKendoAIPrompt();

            that.contentElement = that.options.contentElement;
            that.footerElement = that.options.footerElement;
            that.buttonText = that.options.buttonText;
            that.buttonIcon = that.options.buttonIcon;
            that.service = that.options.service;
        },

        options: {
            name: "AIPromptBaseView",
            buttonText: "",
            buttonIcon: "",
        },

        render: function() {
            let that = this;

            that._renderContent();
            that._renderFooter();
        },

        _renderContentElement: function() {
            let that = this;
            let content = $("<div></div>").addClass("k-prompt-content");
            that.contentElement = content;
            that.element.append(content);

            return that.contentElement;
        },

        _renderFooterElement: function() {
            let that = this;
            let footer = $("<div></div>").addClass("k-prompt-footer");
            that.footerElement = footer;
            that.element.append(footer);

            return that.footerElement;
        },

        _ajaxRequest: function(prompt, isRetry, history) {
            let that = this;
            let service = that.service;
            let data = that._getAjaxData(prompt, isRetry, history);
            const url = typeof service === "string" ? service : service.url;
            const requestOptions = {
                url: url,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(data),
                success: (response) => that._ajaxSuccessHandler(response, isRetry, prompt),
            };

            if (service?.headers) {
                requestOptions.headers = service.headers;
            }
            kendo.ui.progress(that.contentElement, true);

            return $.ajax(requestOptions);
        },

        _ajaxSuccessHandler: function(response, isRetry, prompt) {
            const that = this;
            const outputGetter = that.service?.outputGetter || that._getResponseMessageText;
            const output = {
                id: kendo.guid(),
                output: outputGetter(response),
                prompt: prompt,
                isRetry: isRetry,
                activeView: 1
            };

            that.aiprompt.trigger("promptResponse", {
                output: output.output,
                prompt: output.prompt,
                outputId: output.id,
                isRetry: output.isRetry,
                response: output.response,
            });

            that.aiprompt.addPromptOutput(output);
            that.aiprompt.activeView(output.activeView);

            if (!isRetry) {
                const generateButton = that.footerElement?.find(`button[${REFERENCE_ATTRIBUTES.GENERATE_OUTPUT_BUTTON}]`);
                generateButton?.removeClass(KDISABLED);
            }

            kendo.ui.progress(that.contentElement, false);
        },

        _getResponseMessageText: function(response) {
            return response?.Message?.Text || "An error occurred while processing the request.";
        },

        _getAjaxData: function(prompt, isRetry, history) {
            const that = this;
            const service = that.service;
            let defaultData = [
                {
                    role: {
                        value: messageTypes.user
                    },
                    text: prompt
                }
            ];

            if (history?.length) {
                defaultData = history.concat(defaultData);
            }

            if (typeof service === "string") {
                return defaultData;
            }

            if (kendo.isPresent(service.data) && Object.keys(service.data).length) {
                service.data.messages = defaultData;
                return service.data;
            }

            if (kendo.isFunction(service?.data)) {
                return service.data(prompt, isRetry, history);
            }

            if ($.isPlainObject(service) && kendo.isPresent(service.url)) {
                return defaultData;
            }

            throw new Error("Invalid AIPrompt service configuration.");
        },

        destroy: function() {
            let that = this;
            Widget.fn.destroy.call(that);

            if (that.contentElement) {
                that.contentElement.off();
                kendo.destroy(that.contentElement);
                that.contentElement.remove();
            }

            if (that.footerElement) {
                that.footerElement.off();
                kendo.destroy(that.footerElement);
                that.footerElement.remove();
            }

            that.aiprompt.speechToTextButton = null;
        }
    });

    kendo.ui.AIPromptPromptView = AIPromptBaseView.extend({
        init: function(element, options) {
            let that = this;

            AIPromptBaseView.fn.init.call(that, element, options);
            that.promptSuggestions = that.options.promptSuggestions;
            that.promptSuggestionItemTemplate = that.options.promptSuggestionItemTemplate ?
                kendo.template(that.options.promptSuggestionItemTemplate) :
                kendo.ui.AIPromptTemplateBuilder.createSuggestionItem;

            // Initialize speech manager for speech-to-text functionality
            that.speechManager = new kendo.ui.AIPromptSpeechManager(that, that.options.speechToText);
        },
        options: {
            name: "AIPromptPromptView",
            buttonIcon: "sparkles",
        },

        _renderContent: function() {
            let that = this;
            let suggestions = that.promptSuggestions;
            let promptSuggestionItemTemplate = that.promptSuggestionItemTemplate;

            let content;
            if (that.options.viewTemplate) {
                content = kendo.template(that.options.viewTemplate)({
                    suggestions,
                    promptSuggestionItemTemplate,
                    messages: that.options.messages
                });
            } else {
                content = kendo.ui.AIPromptTemplateBuilder.createPromptView({
                    suggestions,
                    promptSuggestionItemTemplate,
                    messages: that.options.messages
                });
            }

            that._renderContentElement();
            that.contentElement.append(content);
        },

        _renderFooter: function() {
            let that = this;

            let footer;
            if (that.options.footerTemplate) {
                footer = kendo.template(that.options.footerTemplate)({ messages: that.options.messages });
            } else {
                footer = kendo.ui.AIPromptTemplateBuilder.createPromptFooter({ messages: that.options.messages });
            }

            that._renderFooterElement();
            that.footerElement.append(footer);
        },

        setTextAreaValue: function(value) {
            let that = this;
            const textareaWidget = that.contentElement.find(`textarea[${REFERENCE_ATTRIBUTES.PROMPT_INPUT}]`).getKendoTextArea();
            if (textareaWidget) {
                textareaWidget.value(value);
            } else {
                that.contentElement.find(`textarea[${REFERENCE_ATTRIBUTES.PROMPT_INPUT}]`).val(value);
            }
        },

        _focusSuggestion(element) {
            let that = this;
            if (!element || !element.length) {
                return;
            }

            that.contentElement.find(`.${CSS_CLASSES.SUGGESTION_GROUP} .${CSS_CLASSES.SUGGESTION}[tabindex=0]`).attr("tabindex", "-1");

            element.attr("tabindex", "0").trigger("focus");
        },

        startSpeechRecognition: function() {
            let that = this;
            that.speechManager.startRecognition();
        },

        stopSpeechRecognition: function() {
            let that = this;
            that.speechManager.stopRecognition();
        },

        abortSpeechRecognition: function() {
            let that = this;
            that.speechManager.abortRecognition();
        },

        isSpeechListening: function() {
            let that = this;
            return that.speechManager.isListening();
        },

        initializeComponents: function() {
            let that = this;
            let suggestions = that.promptSuggestions;
            const generateButton = that.footerElement.find(`button[${REFERENCE_ATTRIBUTES.GENERATE_OUTPUT_BUTTON}]`);

            // Initialize regular TextArea with speech manager configuration
            let textAreaOptions = $.extend({
                resize: "vertical",
                placeholder: that.options.messages.promptPlaceholder
            }, that.options.promptTextArea || {});

            // Add speech-to-text button suffix if enabled
            if (that.speechManager.isEnabled()) {
                textAreaOptions = $.extend(true, textAreaOptions, that.speechManager.getTextAreaSuffixOptions());
            }

            // Initialize the textarea as a regular Kendo TextArea
            const textareaWidget = that.contentElement.find(`textarea[${REFERENCE_ATTRIBUTES.PROMPT_INPUT}]`).kendoTextArea(textAreaOptions).getKendoTextArea();

            // Initialize speech-to-text button if enabled
            if (that.speechManager.isEnabled()) {
                that.speechManager.initialize(textareaWidget);
            }

            generateButton.kendoButton({
                icon: "sparkles",
                themeColor: "primary",
                rounded: "full",
                click: function(e) {
                    const textareaWidget = that.contentElement.find(`textarea[${REFERENCE_ATTRIBUTES.PROMPT_INPUT}]`).getKendoTextArea();
                    const prompt = textareaWidget ? textareaWidget.value() : that.contentElement.find(`textarea[${REFERENCE_ATTRIBUTES.PROMPT_INPUT}]`).val();
                    const eventArgs = { prompt, isRetry: false, history: [] };

                    if (that.service) {
                        eventArgs.service = that.service;
                    }

                    if (that.aiprompt.trigger("promptRequest", eventArgs)) {
                        return;
                    }

                    if (that.service) {
                        that.aiprompt.transport.read({ prompt: eventArgs.prompt, history: eventArgs.history, isRetry: false, service: that.service });
                    }
                }
            });

            if (suggestions?.length) {
                that.contentElement.find(`.${CSS_CLASSES.SUGGESTION_GROUP} .${CSS_CLASSES.SUGGESTION}`).first().attr("tabindex", "0");
                let nextExpanderContentId = kendo.guid();
                let expanderButton = that.contentElement.find(`.${CSS_CLASSES.PROMPT_EXPANDER} button[${REFERENCE_ATTRIBUTES.PROMPT_SUGGESTIONS_BUTTON}]`);

                that.contentElement.find(`.${CSS_CLASSES.PROMPT_EXPANDER} button[${REFERENCE_ATTRIBUTES.PROMPT_SUGGESTIONS_BUTTON}]`).attr("aria-controls", nextExpanderContentId);
                expanderButton.next(`.${CSS_CLASSES.PROMPT_EXPANDER_CONTENT}`).attr("id", nextExpanderContentId);

                that.contentElement.find(`.${CSS_CLASSES.PROMPT_EXPANDER} button[${REFERENCE_ATTRIBUTES.PROMPT_SUGGESTIONS_BUTTON}]`).kendoButton({
                    icon: "chevron-up",
                    fillMode: "flat",
                    click: function(e) {
                        let expander = $(e.target).closest(".k-prompt-expander");
                        let content = expander.find(".k-prompt-expander-content");
                        let iconEl = e.sender.element.find(".k-icon");
                        kendo.ui.icon(iconEl, content.is(":visible") ? "chevron-down" : "chevron-up");
                        content.toggle();
                        e.sender.element.attr("aria-expanded", content.is(":visible"));
                    }
                });

                that.contentElement.on("click", ".k-suggestion-group .k-suggestion", function(e) {
                    that.setTextAreaValue($(e.target).text());
                });

                that.contentElement.on("keydown", ".k-suggestion-group .k-suggestion", function(e) {
                    if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 36 || e.keyCode === 35 || e.keyCode === 13 || e.keyCode === 32) {
                        e.preventDefault();
                        let target = $(e.target);
                        let siblings = target.siblings();
                        let next, prev;

                        // down arrow
                        if (e.keyCode === 40) {
                            next = target.next();
                            that._focusSuggestion(next);
                        }

                        // up arrow
                        if (e.keyCode === 38) {
                            prev = target.prev();
                            that._focusSuggestion(prev);
                        }

                        // home
                        if (e.keyCode === 36) {
                            prev = siblings.first();
                            that._focusSuggestion(prev);
                        }

                        // end
                        if (e.keyCode === 35) {
                            next = siblings.last();
                            that._focusSuggestion(next);
                        }

                        // enter or space
                        if (e.keyCode === 13 || e.keyCode === 32) {
                            that.setTextAreaValue($(e.target).text());
                        }
                    }
                });

            }

            if (kendo.isFunction(that.options.initializeComponents)) {
                that.options.initializeComponents({ view: that });
            }
        },

        render: function() {
            let that = this;

            that._renderContent();
            that._renderFooter();
            that.initializeComponents();
        },

        destroy: function() {
            let that = this;

            if (that.speechManager) {
                that.speechManager.destroy();
                that.speechManager = null;
            }

            AIPromptBaseView.fn.destroy.call(that);
        }
    });

    kendo.ui.AIPromptOutputView = AIPromptBaseView.extend({
        init: function(element, options) {
            let that = this;

            AIPromptBaseView.fn.init.call(that, element, options);

            that.promptOutputs = (that.aiprompt && that.aiprompt.promptOutputs) ? that.aiprompt.promptOutputs : [];

            that.showOutputRating = that.options.showOutputRating;
            that.isStreaming = that.options.isStreaming || false;
            that.outputActions = that.options.outputActions;
            that.outputTemplate = that.options.outputTemplate;

            that.outputActionManager = that.options.outputActionManager;
        },

        options: {
            name: "AIPromptOutputView",
            buttonIcon: "comment",
            isStreaming: false,
            promptOutputs: []
        },

        startStreaming: function() {
            let that = this;
            // Set view-level streaming state
            that.isStreaming = true;

            // Show stop generation button
            that._showStopButton();
        },

        stopStreaming: function() {
            let that = this;
            // Set view-level streaming state
            that.isStreaming = false;

            // Hide stop generation button
            that._hideStopButton();
        },

        _showStopButton: function() {
            let that = this;

            if (!that.stopGenerationButton) {
                if (that._initStopGenerationButton()) {
                    that.stopGenerationButton.show();
                }
            } else {
                that.stopGenerationButton.show();
            }
        },

        _hideStopButton: function() {
            let that = this;

            if (that.stopGenerationButton) {
                that.stopGenerationButton.hide();
            }
        },

        renderPromptOutput: function(output) {
            let that = this;
            let showOutputRating = that.options.showOutputRating;
            let encodedPromptOutputs = that.options.encodedPromptOutputs;
            let messages = that.options.messages;
            let isStreaming = that.isStreaming || false; // Use view-level streaming state
            let outputActions = that.outputActions;

            // Ensure cardListContainer exists
            if (!that.cardListContainer || that.cardListContainer.length === 0) {
                if (that.outputsContainer) {
                    that.cardListContainer = that.outputsContainer.find('.k-card-list');
                }
                if (!that.cardListContainer || that.cardListContainer.length === 0) {
                    return;
                }
            }

            // Initialize floating action button if output is streaming and button doesn't exist
            if (isStreaming && !that.stopGenerationButton) {
                that._initStopGenerationButton();
            }

            // Check if we have an enhanced output object from the main widget
            const outputObj = that.aiprompt.outputObjects.get(output.id);

            if (outputObj) {
                // Create the card HTML directly using the template builder
                const cardHtml = kendo.ui.AIPromptTemplateBuilder.createOutputCard({
                    output,
                    showOutputRating,
                    messages,
                    showOutputSubtitleTooltip: true,
                    encodedPromptOutputs,
                    isStreaming,
                    outputActions,
                    outputTemplate: that.outputTemplate
                });

                // Create jQuery element and store references in output object
                const card = $(cardHtml);
                outputObj._element = card;
                outputObj._bodyElement = card.find(`.k-card-body`);

                // Append to the card list container
                that.cardListContainer.prepend(card);

                // Handle initial state based on loading status
                if (output.isLoading) {
                    outputObj.showSkeleton();
                } else if (output.output) {
                    outputObj.applyFinalTemplate();
                }

                that.initializeComponents(card);
            } else {
                // Fallback to original rendering method
                let card = $(kendo.ui.AIPromptTemplateBuilder.createOutputCard({
                    output,
                    showOutputRating,
                    messages,
                    showOutputSubtitleTooltip: true,
                    encodedPromptOutputs,
                    isStreaming,
                    outputActions,
                    outputTemplate: that.outputTemplate
                }));
                that.cardListContainer.prepend(card);
                that.initializeComponents(card);
            }
        },

        updatePromptOutputContent: function(outputId, content) {
            let that = this;

            // Use the main widget's output object for streamlined management
            const outputObj = that.aiprompt.outputObjects.get(outputId);

            if (outputObj) {
                outputObj.updateContent(content);
            }
        },

        _initStopGenerationButton: function() {
            let that = this;
            let contentElement = that.contentElement;

            // Ensure contentElement exists and is in DOM
            if (!contentElement || contentElement.length === 0) {
                return false;
            }

            // Check if button already exists
            if (that.stopGenerationButton) {
                return true;
            }

            let stopFab = $("<button class='k-prompt-stop-fab k-generating'></button>");
            stopFab.attr({
                "aria-label": that.options.messages.stopGeneration,
                "title": that.options.messages.stopGeneration
            });

            contentElement.prepend(stopFab);

            that.stopGenerationButton = stopFab.kendoFloatingActionButton({
                _classNames: ["k-prompt-stop-fab", "k-generating"],
                icon: "stop-sm",
                positionMode: "absolute",
                align: "bottom end",
                rounded: "full",
                click: function(e) {
                    // Stop streaming and trigger cancel event
                    that.stopStreaming();
                    that.aiprompt.trigger("promptRequestCancel", {});
                }
            }).getKendoFloatingActionButton();

            that.stopGenerationButton.hide();
            return true;
        },
        _renderContent: function() {
            let that = this;
            let promptOutputs = that.promptOutputs;
            let showOutputRating = that.options.showOutputRating;
            let showOutputSubtitleTooltip = that.options.showOutputSubtitleTooltip;
            let messages = that.options.messages;
            let encodedPromptOutputs = that.options.encodedPromptOutputs;
            let outputActions = that.outputActions;

            let outputsContainer;
            if (that.viewTemplate) {
                outputsContainer = kendo.template(that.viewTemplate)({
                    promptOutputs, showOutputRating, messages, showOutputSubtitleTooltip,
                    encodedPromptOutputs, outputActions, outputTemplate: that.outputTemplate
                });
            } else {
                outputsContainer = kendo.ui.AIPromptTemplateBuilder.createOutputView({
                    promptOutputs, showOutputRating, messages, showOutputSubtitleTooltip,
                    encodedPromptOutputs, outputActions, outputTemplate: that.outputTemplate
                });
            }

            that.outputsContainer = $(outputsContainer);
            that.cardListContainer = that.outputsContainer.find('.k-card-list');
            that._renderContentElement();
            that.contentElement.append(that.outputsContainer);

            that._initStopGenerationButton();
        },

        initializeComponents: function(parentElement) {
            let that = this;
            parentElement = parentElement || that.contentElement;

            // Use the output action manager to handle all button initialization
            that.outputActionManager.initializeButtons(parentElement, that.outputActions);

            // Handle CSP-compliant styling for loading content
            parentElement.find('[data-loading="true"]').hide();
            parentElement.find('[data-loading="false"]').show();

            // Update DOM references for existing output objects after template rendering
            // and ensure buttons are initialized for all cards
            if (that.aiprompt && that.aiprompt.outputObjects) {
                that.aiprompt.outputObjects.forEach((outputObj, outputId) => {
                    // Find the corresponding DOM element for this output
                    const cardElement = parentElement.find(`.k-card[data-id="${outputId}"]`);
                    if (cardElement.length > 0) {
                        // Update the output object's DOM references
                        outputObj._element = cardElement;
                        outputObj._bodyElement = cardElement.find('.k-card-body');

                        // Apply custom output template for existing outputs when switching views
                        if (that.outputTemplate && typeof that.outputTemplate === 'function' &&
                            outputObj.data && outputObj.data.output && !outputObj.data.isLoading) {
                            const customContent = that.outputTemplate({
                                output: outputObj.data,
                                content: outputObj.data.output
                            });
                            outputObj._bodyElement.html(customContent);
                        }

                        // Initialize buttons for this specific card if not already initialized
                        // Check if buttons are already initialized by looking for kendoButton data
                        const buttons = cardElement.find('.k-button');
                        const hasInitializedButtons = buttons.length > 0 && buttons.first().data('kendoButton');
                        if (!hasInitializedButtons && buttons.length > 0) {
                            // Initialize buttons for this specific card only
                            that.outputActionManager.initializeButtons(cardElement, that.outputActions);
                        }
                    }
                });
            }
        },

        _initializeCardButtons: function(cardElement) {
            let that = this;
            // Delegate all button initialization to the output action manager
            that.outputActionManager.initializeButtons(cardElement, that.outputActions);
        },

        render: function() {
            let that = this;
            that._renderContent();
            that.initializeComponents();

            that.contentElement.on("keydown", ".k-card", function(e) {
                let target = $(e.target);

                // if up or down arrow, focus next or previous card
                // if home or end, focus first or last card
                if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 36 || e.keyCode === 35) {
                    e.preventDefault();

                    // down arrow
                    if (e.keyCode === 40) {
                        target.next(".k-card").trigger("focus");
                    }

                    // up arrow
                    if (e.keyCode === 38) {
                        target.prev(".k-card").trigger("focus");
                    }

                    // home
                    if (e.keyCode === 36) {
                        that.contentElement.find(".k-card").first().trigger("focus");
                    }

                    // end
                    if (e.keyCode === 35) {
                        that.contentElement.find(".k-card").last().trigger("focus");
                    }
                }
            });
        },

        destroy: function() {
            let that = this;


            // Call parent destroy
            AIPromptBaseView.fn.destroy.call(that);
        }
    });

    kendo.ui.AIPromptCommandsView = AIPromptBaseView.extend({
        options: {
            name: "AIPromptCommandsView",
            buttonText: "",
            buttonIcon: "more-horizontal",
            promptCommands: []
        },

        initializeComponents: function() {
            let that = this;
            let commandItems = that.options.promptCommands;

            let panelBarEl = $("<div></div>").kendoPanelBar({
                animation: false,
                dataSource: commandItems,
                selectable: false,
                select: function(ev) {
                    let item = $(ev.item);
                    let dataItem = this.dataItem(item);
                    if (dataItem.hasChildren) {
                        return;
                    }

                    that.aiprompt.trigger("commandExecute", { sender: that.aiprompt, item: dataItem });
                }
            });
            const promptViewWrapper = $("<div class='k-prompt-view'>");
            promptViewWrapper.append(panelBarEl);

            that.contentElement.append(promptViewWrapper);
        },

        render: function() {
            let that = this;
            that._renderContentElement();
            that.initializeComponents();
        },
    });

    let EMPTY_TEMPLATE = () => "";
    kendo.ui.AIPromptCustomView = AIPromptBaseView.extend({
        options: {
            name: "AIPromptCustomView",
            buttonText: "",
            buttonIcon: "",
            viewTemplate: EMPTY_TEMPLATE,
            footerTemplate: EMPTY_TEMPLATE,
        },

        initializeComponents: function() {
            let that = this;
            if (typeof that.options.initializeComponents === "function") {
                that.options.initializeComponents.call(that);
            }
        },

        _renderContent: function() {
            let that = this;
            let content = kendo.template(that.options.viewTemplate)({ aiprompt: that });

            that._renderContentElement();
            that.contentElement.append(content);
        },

        _renderFooter: function() {
            let that = this;
            if (that.options.footerTemplate === EMPTY_TEMPLATE) {
                return;
            }

            let footer = kendo.template(that.options.footerTemplate)({ messages: that.options.messages });

            that._renderFooterElement();
            that.footerElement.append(footer);
        },
        render: function() {
            let that = this;
            that._renderContent();
            that._renderFooter();
            that.initializeComponents();
        },
    });

})(window.kendo.jQuery);
kendo;

const __meta__ = {
    id: "aiprompt",
    name: "AIPrompt",
    category: "web",
    description: "The AIPrompt component simplifies the incorporation of external AI services into apps.",
    depends: ["core", "icons", "textarea", "button", "toolbar", "panelbar", "data", "floatingactionbutton", "skeletoncontainer", "speechtotextbutton"],
};

(function($) {
    let kendo = window.kendo,
        Widget = kendo.ui.Widget,
        NS = ".kendoAIPrompt",
        ui = kendo.ui,
        extend = $.extend,

        COMMAND_EXECUTE = "commandExecute",
        PROMPT_REQUEST = "promptRequest",
        PROMPT_RESPONSE = "promptResponse",
        OUTPUT_RATING = "outputRating",
        OUTPUT_COPY = "outputCopy",
        OUTPUT_VIEW = "output",
        OUTPUT_ACTION = "outputAction",
        PROMPT_REQUEST_CANCEL = "promptRequestCancel",

        DEFAULT_OUTPUT_ACTIONS = ["copy", "retry", "spacer", "rating"],
        DEFAULT_OUTPUT_ACTIONS_WITHOUT_RATING = ["copy", "retry"],

        FOCUS = "focus";

    let cssClasses = {
        aIPrompt: "k-prompt"
    };

    let defaultViews = {
        prompt: {
            type: "kendo.ui.AIPromptPromptView",
            name: "prompt",
            buttonIcon: "sparkles",
        },
        output: {
            type: "kendo.ui.AIPromptOutputView",
            name: "output",
            buttonIcon: "comment",
        },
        commands: {
            type: "kendo.ui.AIPromptCommandsView",
            name: "commands",
            buttonIcon: "more-horizontal",
        },
        custom: {
            type: "kendo.ui.AIPromptCustomView",
            name: "custom",
        }
    };

    let AIPrompt = Widget.extend({
        init: function(element, options) {
            let that = this;
            options = options || {};

            Widget.fn.init.call(that, element, options);

            if (that.options.views.length == 0) {
                that.options.views = ["prompt", "output"];

                if (this.options.promptCommands && this.options.promptCommands.length) {
                    this.options.views.push("commands");
                }
            }

            that.options.outputActions = (options.outputActions && options.outputActions.length > 0) ? options.outputActions : DEFAULT_OUTPUT_ACTIONS_WITHOUT_RATING;

            that.promptOutputs = that.options.promptOutputs || [];
            that.outputObjects = new Map();

            that.outputManager = new kendo.ui.AIPromptOutputManager(that);

            // Initialize output action manager at component level
            that.outputActions = kendo.ui.AIPromptOutputActionManager.processOutputActions(that.options.outputActions);
            that.outputActionManager = new kendo.ui.AIPromptOutputActionManager(that, {
                outputActions: that.outputActions
            });

            // Populate outputObjects if promptOutputs is not empty
            if (Array.isArray(that.promptOutputs) && that.promptOutputs.length > 0) {
                that.promptOutputs.forEach(output => {
                    if (!output.id) {
                        output.id = kendo.guid();
                    }
                    const outputObj = that.outputManager.createOutputObject(output);
                    that.outputObjects.set(output.id, outputObj);
                });
            }

            that._initLayout();
            that._initViews();
            that._initToolbar();
            that.activeView(that.options.activeView);

            if (that.options.service) {
                that.transport = new kendo.data.AiTransport({
                    service: that.options.service,
                    success: that._serviceSuccess.bind(that),
                    requestStart: () => kendo.ui.progress(that.element, true)
                });
            }

            kendo.notify(that);
        },

        options: {
            name: "AIPrompt",
            enabled: true,
            toolbarItems: [],
            promptOutputs: [],
            encodedPromptOutputs: true,
            activeView: 0,
            views: [],
            popup: null,
            speechToText: false,
            promptTextArea: null,
            messages: {
                promptView: "Ask AI",
                outputView: "Output",
                commandsView: "",
                customView: "Custom View",
                promptPlaceholder: "Ask or generate content with AI",
                promptSuggestions: "Prompt Suggestions",
                generateOutput: "Generate",
                outputTitle: "Generated with AI",
                outputRetryTitle: "Generated with AI",
                copyOutput: "Copy",
                retryGeneration: "Retry",
                ratePositive: "",
                rateNegative: "",
                stopGeneration: "Stop Generation"
            },
            showOutputRating: true,
            service: null,
            suffixTemplate: null,
            outputTemplate: null,
            outputActions: DEFAULT_OUTPUT_ACTIONS
        },

        events: [
            COMMAND_EXECUTE,
            PROMPT_REQUEST,
            PROMPT_RESPONSE,
            PROMPT_REQUEST_CANCEL,
            OUTPUT_RATING,
            OUTPUT_COPY,
            OUTPUT_ACTION
        ],

        _serviceSuccess: function(output) {
            const that = this;
            const outputViewIndex = that.viewsArray.findIndex(v => v.name === OUTPUT_VIEW);

            output.activeView = outputViewIndex;
            if (!that.trigger(PROMPT_RESPONSE, {
                output: output.output,
                prompt: output.prompt,
                outputId: output.id,
                isRetry: output.isRetry || false,
                response: output.response,
            })) {
                that.addPromptOutput(output);
                that.activeView(output.activeView);
                kendo.ui.progress(that.element, false);
            }

        },

        _initializeView: function(name) {
            let viewConfig = this.views[name];
            let view;
            if (viewConfig) {
                let type = viewConfig.type;

                if (typeof type === "string") {
                    type = kendo.getter(viewConfig.type)(window);
                }

                if (type) {
                    view = new type(this.element, extend(true, {
                        promptSuggestions: this.options.promptSuggestions,
                        promptCommands: this.options.promptCommands,
                        promptOutputs: this.promptOutputs,
                        showOutputRating: this.showOutputRating,
                        messages: this.options.messages,
                        showOutputSubtitleTooltip: this.options.showOutputSubtitleTooltip,
                        encodedPromptOutputs: this.options.encodedPromptOutputs,
                        promptSuggestionItemTemplate: this.options.promptSuggestionItemTemplate,
                        service: this.options.service,
                        speechToText: this.options.speechToText,
                        promptTextArea: this.options.promptTextArea,
                        outputActions: this.outputActions,
                        outputActionManager: this.outputActionManager,
                        outputTemplate: this.options.outputTemplate,
                    },
                        viewConfig
                    ));
                } else {
                    throw new Error("There is no such view");
                }
            }

            return view;
        },

        _unbindView: function(view) {
            if (view) {
                view.destroy();
            }
        },

        _initViews: function() {
            let that = this,
                options = that.options,
                views = options.views;

            that.views = {};
            that.viewsArray = [];

            for (let i = 0, l = views.length; i < l; i++) {
                let view = views[i];
                let isSettings = typeof view === "object";
                let name = view;

                if (isSettings) {
                    view = { ...view };
                    name = typeof view.type !== "string" ? view.name : view.type;
                }

                let defaultView = defaultViews[name];

                if (defaultView) {
                    if (isSettings) {
                        view.type = defaultView.type;
                    }

                    defaultView.buttonText = that.options.messages[`${name}View`];
                }

                view = Object.assign({ title: view.title, name, index: i }, defaultView, isSettings ? view : {});
                that.viewsArray.push(view);

                if (name) {
                    that.views[name] = view;
                }
            }
        },

        getViews: function() {
            return this.viewsArray;
        },

        activeView: function(name) {
            let that = this;
            if (name === undefined) {
                return that._activeViewIndex;
            }

            if (Number.isInteger(name)) {
                name = that.viewsArray[name].name;
            }

            if (name && that.views[name]) {
                if (that._selectedView) {
                    that._unbindView(that._selectedView);
                }

                that._selectedView = that._initializeView(name);
                that._activeViewIndex = that.viewsArray.findIndex(v => v.name === name);
                that._selectedView.render();

                that._updateToolbarState(that._activeViewIndex);

                let toolItem = $(that.toolbar._getAllItems()[that._activeViewIndex]);
                that.toolbar._resetTabIndex(toolItem);
                toolItem.trigger(FOCUS);
            }
        },

        addPromptOutput: function(output) {
            if (typeof output === 'string') {
                output = { output: output };
            }

            output.id = output.id || kendo.guid();

            const outputObj = this.outputManager.createOutputObject(output);
            this.promptOutputs.unshift(output);
            this.outputObjects.set(output.id, outputObj);

            if (this._selectedView && typeof this._selectedView.renderPromptOutput === "function") {
                this._selectedView.renderPromptOutput(output);

                if (output.isLoading) {
                    this.startStreaming();
                }
            }
        },

        removePromptOutput: function(output) {
                const that = this;
                let outputId = output;

                const removeOutput = (id) => {
                    const el = that.promptOutputs.find((el) => el.id === id);

                    if (el) {
                        that.promptOutputs = that.promptOutputs.filter((item) => item.id !== id);
                    }

                    that.outputObjects.delete(id);
                };

                if (outputId instanceof jQuery) {
                    outputId = output.data("id");
                    output.remove();
                    removeOutput(outputId);
                } else {
                    that.element.find("[data-id='" + outputId + "']").remove();
                    removeOutput(outputId);
                }
        },

        clearOutput: function() {
            const that = this;
            const elements = that.element.find("[data-id]");
            elements.each(function() {
                const id = $(this).data("id");
                that.outputObjects.delete(id);
            });
            elements.remove();
            that.promptOutputs = [];
        },

        _updateToolbarState: function(activeToolIndex) {
            let toolbar = this.toolbar;
            toolbar.element.find(".k-toolbar-toggle-button").each(function(index, elm) {
                toolbar.toggle($(elm), index == activeToolIndex);
            });
        },

        _initLayout: function() {
            let that = this,
                header = $("<div></div>").addClass("k-prompt-header");
            that.header = header;
            that.element.addClass(cssClasses.aIPrompt);
            that.element.append(header);
            const popupWrapper = that.element.closest('.k-popup');

            if (popupWrapper.length) {
                $(popupWrapper).addClass('k-prompt-popup');
            }
        },

        _getViewTools: function() {
            let that = this;

            return that.viewsArray.map(v => {
                if (v.name === 'commands') {
                    if (v.buttonText) {
                        v.title = v.buttonText;
                    } else {
                        v.title = "More Actions";
                    }
                }

                return {
                type: "button",
                text: v.buttonText,
                icon: v.buttonIcon,
                fillMode: "flat",
                themeColor: v.themeColor || "primary",
                rounded: "full",
                togglable: true,
                attributes: { title: v.title },
                toggle: function() {
                    that.activeView(v.name);
                }
            };
        });
        },

        _initToolbar: function() {
            let that = this;
            let items = that.options.toolbarItems;
            items = Array.isArray(items) ? items : [items];
            const closeButton = items.find(item => item.icon === 'x');

            if (closeButton) {
                closeButton.themeColor = 'base';
            }

            let toolbarEl = $("<div></div>").kendoToolBar({
                resizable: false,
                fillMode: "flat",
                items: that._getViewTools().concat(items)
            }).appendTo(that.header);

            that.toolbar = toolbarEl.data("kendoToolBar");
        },

        focus: function() {
            let that = this;
            that.element.trigger(FOCUS);
        },

        updatePromptOutputContent: function(content, outputId) {
            let that = this;

            return that.outputManager.updatePromptOutputContent(content, outputId);
        },

        startStreaming: function() {
            let that = this;

            if (that._selectedView && typeof that._selectedView.startStreaming === "function") {
                that._selectedView.startStreaming();
            }
        },

        stopStreaming: function() {
            let that = this;

            if (that._selectedView && typeof that._selectedView.stopStreaming === "function") {
                that._selectedView.stopStreaming();
            }

            if (that.outputManager) {
                that.outputManager.stopAllLoading();
            }
        },

        setOptions: function(options) {
            let that = this;
            let el = that.element;
            let originalOptions = that.options;
            let newOptions = extend({}, originalOptions, options);

            kendo.destroy(el);

            $(el).empty();

            that.init(el, newOptions);
        },

        destroy: function() {
            let that = this;

            if (that.toolbar) {
                that.toolbar.destroy();
                that.toolbar = null;
            }

            if (that._selectedView) {
                that._selectedView.destroy();
                that._selectedView = null;
            }

            if (that.outputManager) {
                that.outputManager.destroy();
                that.outputManager = null;
            }

            if (that.outputActionManager) {
                that.outputActionManager.destroy();
                that.outputActionManager = null;
            }

            that.promptOutputs = null;
            if (that.outputObjects) {
                that.outputObjects.clear();
                that.outputObjects = null;
            }

            if (that.transport) {
                that.transport = null;
            }

            that.element.off(NS);

            Widget.fn.destroy.call(that);
        }
    });

    ui.plugin(AIPrompt);

})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
