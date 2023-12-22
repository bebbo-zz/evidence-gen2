//
//  EvidenceGen2App.swift
//  EvidenceGen2
//
//  Created by Brehm, Martin on 19/12/23.
//

import Amplify
import Authenticator
import AWSCognitoAuthPlugin
import SwiftUI
import AWSAPIPlugin

@main
struct EvidenceGen2App: App {
    init() {
        do {
            try Amplify.add(plugin: AWSCognitoAuthPlugin())
            try Amplify.add(plugin: AWSAPIPlugin(modelRegistration: AmplifyModels()))
            try Amplify.configure()
        } catch {
            print("Unable to configure Amplify \(error)")
        }
    }
   /*
    func deleteTodo(todo: Todo) async {
        do {
            let result = try await Amplify.API.mutate(request: .delete(todo))
            switch result {
            case .success(let todo):
                print("Successfully deleted todo: \(todo)")
            case .failure(let error):
                print("Got failed result with \(error.errorDescription)")
            }
        } catch let error as APIError {
            print("Failed to deleted todo: ", error)
        } catch {
            print("Unexpected error: \(error)")
        }
    }

    func updateTodo(todo: Todo) async {
        do {
            let result = try await Amplify.API.mutate(request: .update(todo))
            switch result {
            case .success(let todo):
                print("Successfully updated todo: \(todo)")
            case .failure(let error):
                print("Got failed result with \(error.errorDescription)")
            }
        } catch let error as APIError {
            print("Failed to updated todo: ", error)
        } catch {
            print("Unexpected error: \(error)")
        }
    }
*/
    var body: some Scene {
        WindowGroup {
            Authenticator { state in
                NavigationStack {
                    RootView()
                }
            }
        }
    }
}
