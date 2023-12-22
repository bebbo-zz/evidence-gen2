//
//  ContentView.swift
//  EvidenceGen2
//
//  Created by Brehm, Martin on 19/12/23.
//

import Amplify
import AWSCognitoAuthPlugin
import SwiftUI
import AWSAPIPlugin

struct ContentView: View {
    
    func createTodo() async {
        let creationTime = Temporal.DateTime.now()
        let todo = Todo(
            content: "Random Todo \(creationTime)",
            isDone: false,
            createdAt: creationTime,
            updatedAt: creationTime
        )
        do {
            let result = try await Amplify.API.mutate(request: .create(todo))
            switch result {
            case .success(let todo):
                print("Successfully created todo: \(todo)")
            case .failure(let error):
                print("Got failed result with \(error.errorDescription)")
            }
        } catch let error as APIError {
            print("Failed to create todo: ", error)
        } catch {
            print("Unexpected error: \(error)")
        }
    }
    
    func listTodos() async {
        let request = GraphQLRequest<Todo>.list(Todo.self)
        do {
            let result = try await Amplify.API.query(request: request)
            switch result {
            case .success(let todos):
                self.todos = todos.elements
                print("Successfully retrieved list of todos: \(todos)")
            case .failure(let error):
                print("Got failed result with \(error.errorDescription)")
            }
        } catch let error as APIError {
            print("Failed to query list of todos: ", error)
        } catch {
            print("Unexpected error: \(error)")
        }
    }
    
    @State var todos: [Todo] = []
    
    var body: some View {
        VStack {
            List(todos, id: \.id) { todo in
                @State var isToggled = todo.isDone!
                Toggle(isOn: $isToggled
                ) {
                    Text(todo.content!)
                }.onTapGesture {
                    var updatedTodo = todos.first {$0.id == todo.id}!
                    // view details
                }
                .toggleStyle(.switch)
            }
            Button(action: {
                Task {
                    await createTodo()
                    await listTodos()
                }
            }) {
                HStack {
                    Text("Add a New Todo")
                    Image(systemName: "plus")
                }
            }
            .accessibilityLabel("New Todo")
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
