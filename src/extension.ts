// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Provider from "./provider";
import { ExtensionGlobalState, Providers } from "./interfaces";
import { OllamaProvider } from "./providers";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log(context.globalState.get("name-it-config"));
  console.log("Congratulations, name-it have been installed successfully.");

  // This command will run a function that sets up the provider and
  // saves the information's about the API in globalState to use them later
  // in other commands.
  context.subscriptions.push(
    vscode.commands.registerCommand("name-it.setup-provider", () =>
      setupProvider(context)
    )
  );

  // This command will run a function which allows you to ask a question about
  // the name you want to have as a result for your naming process.
  context.subscriptions.push(
    vscode.commands.registerCommand("name-it.write", () => {
      write(context);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

const ollamaProvider = new OllamaProvider({
  providerName: "Ollama",
});

const providers: Providers = {
  Ollama: {
    provider: ollamaProvider,
    defaultAPIUrl: "http://localhost:11434/api",
    needAPIKey: false,
    timeout: 1000,
  },
};

async function setupProvider(context: vscode.ExtensionContext) {
  let provider: Provider = new Provider({ providerName: "" });
  let newGlobalState: ExtensionGlobalState = {};

  let currentProviderName: string | undefined;
  const providersNames = Object.keys(providers);

  await vscode.window.showQuickPick(providersNames, {
    title: "Select provider",
    onDidSelectItem(item) {
      provider = providers[item as string].provider as Provider;

      currentProviderName = item as string;
      newGlobalState.providerName = provider.params.providerName;
    },
  });

  const apiUrl = await vscode.window.showInputBox({
    title: "Enter API Url",
    placeHolder: "http://example.com/api",
  });

  if (apiUrl?.length === 0 && currentProviderName) {
    vscode.window.showWarningMessage(
      `No API url was provide, default url will be http://localhost:11434/api`
    );

    provider.params.api = providers[currentProviderName].defaultAPIUrl;
    newGlobalState.api = providers[currentProviderName].defaultAPIUrl;
  } else {
    newGlobalState.api = apiUrl;
    provider.params.api = apiUrl;
  }

  if (provider.params.needAPIKey) {
    // TODO: Add implementation for closed source providers.
  }

  if (!(await provider.setup())) {
    await vscode.window.showErrorMessage(
      `There is no server running on url ${provider.params.api}.`
    );
  }

  const models = provider.listAvailableModels();

  await vscode.window.showQuickPick(models, {
    title: "Select model",
    onDidSelectItem(item) {
      // newGlobalState.providerName = provider.params.providerName;
      newGlobalState.activeModel = item as string;
    },
  });

  context.globalState.update("name-it-config", newGlobalState);
}

async function write(context: vscode.ExtensionContext) {
  const provider = await checkExtensionConfiguration(context);
  const activeTextEditor = vscode.window.activeTextEditor;

  if (!provider) {
    return;
  }

  if (!activeTextEditor) {
    vscode.window.showErrorMessage(
      "Please select a text editor document to allow inserting result."
    );
    return;
  }

  const languageId = activeTextEditor.document.languageId;

  let question = await vscode.window.showInputBox({
    title:
      "Your question about the name (without specifying anything about the project or language).",
    placeHolder: "Ask here",
  });

  const prompt = `
    You're a software developer working on a project of ${languageId}, you will be asked on naming functions, classes, variables, etc..., your answer must be an example of code that is not markdown containing naming your'e asked about. your answer must not be markdown, just normal text, must only and only include the example of code about naming. the question is "${question}"
  `;

  provider.askQuestion(
    prompt,
    question as string,
    provider.params.activeModel as string,
    (data) => {
      if (activeTextEditor) {
        const position = activeTextEditor.selection.active;

        activeTextEditor.edit((editBuilder) => {
          editBuilder.insert(position, "\n");
          editBuilder.insert(position, data);
        });
      }
    }
  );

  // textEditor.edit((editBuilder) => {
  //   editBuilder.insert(position, "\n");
  // });
}

async function checkExtensionConfiguration(
  context: vscode.ExtensionContext
): Promise<Provider | undefined> {
  const currentState: ExtensionGlobalState | undefined =
    context.globalState.get("name-it-config");

  if (!currentState) {
    vscode.window.showErrorMessage(
      "There is no provider accessible currently, try running command 'Name it: Setup provider'."
    );
    return;
  }

  let provider = new OllamaProvider(currentState);

  if (!(await provider.setup())) {
    const option = await vscode.window.showErrorMessage(
      `There is no server listening at ${provider.params.api}, try to make the server running or make sure you have ran the command 'Name it: Setup provider' to setup the provider, do you want me to run it for you?`,
      "Yes",
      "No"
    );

    if (option === "Yes") {
      vscode.commands.executeCommand("name-it.setup-provider");
    }

    return;
  }

  return provider;
}
