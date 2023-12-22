//
//  RootView.swift
//  EvidenceGen2
//
//  Created by Brehm, Martin on 21/12/23.
//

import SwiftUI
import Amplify
import Authenticator

struct RootView: View {
   
    var body: some View {
        ZStack {
            // background
            Color.teal
                .ignoresSafeArea(.all)
            
            CreateEntryView()
        }
    }
}

#Preview {
    RootView()
}
