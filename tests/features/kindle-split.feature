Feature: Kindle highlights split
  Splitting a single "Kindle highlights" note into one atomic note per highlight, with the
  original frontmatter preserved, a backlink to the source, and an optional delete of the original.

  Scenario: A normal note is not recognised as a Kindle highlights note
    Given a fresh copy of the test vault
    When I choose the Kindle note "Agile estimating and planning - Mike Cohn"
    Then the note is not recognised as a Kindle highlights note

  Scenario: A Kindle highlights note is recognised
    Given a fresh copy of the test vault
    When I choose the Kindle note "Agile Estimating and Planning - Kindle highlights"
    Then the note is recognised as a Kindle highlights note

  Scenario: Preview produces one note per highlight
    Given a fresh copy of the test vault
    When I choose the Kindle note "Agile Estimating and Planning - Kindle highlights"
    And I preview the Kindle split with prefix "Agile Estimating and Planning - Kindle highlights"
    Then 187 split notes are produced

  Scenario: Applying the split writes one note per highlight and keeps the original
    Given a fresh copy of the test vault
    When I choose the Kindle note "Agile Estimating and Planning - Kindle highlights"
    And I apply the Kindle split with prefix "AEP highlight" into "Books"
    Then 187 split notes were created
    And the first split note contains "# Highlight 001"
    And the first split note contains "source:"
    And the original note still exists

  Scenario: Deleting the original after splitting
    Given a fresh copy of the test vault
    When I choose the Kindle note "Agile Estimating and Planning - Kindle highlights"
    And I apply the Kindle split with prefix "AEP highlight" into "Books" deleting the original
    Then 187 split notes were created
    And the original note no longer exists
