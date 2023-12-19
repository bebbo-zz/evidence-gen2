// swiftlint:disable all
import Amplify
import Foundation

public struct Todo: Model {
  public let id: String
  public var content: String?
  public var isDone: Bool?
  public var owner: String?
  public var createdAt: Temporal.DateTime
  public var updatedAt: Temporal.DateTime
  
  public init(id: String = UUID().uuidString,
      content: String? = nil,
      isDone: Bool? = nil,
      owner: String? = nil,
      createdAt: Temporal.DateTime,
      updatedAt: Temporal.DateTime) {
      self.id = id
      self.content = content
      self.isDone = isDone
      self.owner = owner
      self.createdAt = createdAt
      self.updatedAt = updatedAt
  }
}