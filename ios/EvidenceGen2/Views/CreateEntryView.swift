//
//  CreateEntryView.swift
//  EvidenceGen2
//
//  Created by Brehm, Martin on 21/12/23.
//

import Amplify
import AWSCognitoAuthPlugin
import SwiftUI
import AWSAPIPlugin

@MainActor
final class CreateEntryViewModel: ObservableObject {
    @Published var textInput: String = ""
    @Published var isLoading = false
    @Published var showAlert = false
    @Published var alertType: AlertType? = nil
    
    func saveText() async {
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
    
    func scheduledDismissal(completion: @escaping () -> Void) {
            DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(1), execute: {
                self.showAlert = false
                completion()
            })
        }
}

struct CreateEntryView: View {
    
    @Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
    @StateObject private var viewModel = CreateEntryViewModel()
    
    var body: some View {
        VStack(spacing: 10) {
                        Spacer()
                        
                        Text("Store Text")
                            .foregroundColor(.white)
                            .font(.largeTitle)
                        
                        TextEditor(text: $viewModel.textInput)
                            .font(.subheadline)
                            .colorMultiply(Color(#colorLiteral(red: 0.8374180198, green: 0.8374378085, blue: 0.8374271393, alpha: 1)))
                            .cornerRadius(10)
                                           
                                           
                        Button(action: {
                            viewModel.isLoading = true
                            Task {
                                    await viewModel.saveText()
                                    viewModel.alertType = .success
                                    viewModel.isLoading = false
                                    viewModel.showAlert = true
                                    viewModel.scheduledDismissal() {
                                        self.presentationMode.wrappedValue.dismiss()
                                    }
                            }
                        }) {
                            Text("Save")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(height: 55)
                                .frame(maxWidth: .infinity)
                                .background(
                                    RadialGradient(gradient: Gradient(colors: [Color(red: 0.0, green: 0.2, blue: 0.3), Color(red: 0.0, green: 0.6, blue: 0.7)]), center: .leading, startRadius: 5, endRadius: 900)
                                )
                                .cornerRadius(10)
                        } // Button
                        Spacer()
                    } // VStack
                    .padding()
                    
                    if viewModel.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .background(Color.white.opacity(0.5))
                            .edgesIgnoringSafeArea(.all)
                    }
    }
}

#Preview {
    CreateEntryView()
}
