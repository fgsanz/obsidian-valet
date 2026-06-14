Feature: Add value operation
  Adding a new value to a property, respecting whether the property allows
  multiple values, its property type, and never producing duplicates.

  Scenario: Appending a link note to a link-array property that exists and is not empty, adds the link note
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "related" "exists and is not empty"
    And 1 notes match
    And I apply add value on property "related" with value to add "[[New note]]"
    Then 1 notes are changed
    And note "Note A" has "[[Topic A]]" in "related"
    And note "Note A" has "[[Topic B]]" in "related"
    And note "Note A" has "[[Topic C]]" in "related"
    And note "Note A" has "[[New note]]" in "related"
    And the YAML of "Note A" is still valid

  Scenario: Appending a link note to a link-array property that exists and is empty, adds the link note
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "related" "exists and is empty"
    And 1 notes match
    And I apply add value on property "related" with value to add "[[New note]]"
    Then 1 notes are changed
    And note "Note B" has "[[New note]]" in "related"
    And the YAML of "Note B" is still valid

  Scenario: Appending a link note to a link-array property that is undefined, adds the property and the link note
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "related" "does not exist"
    And 1 notes match
    And I apply add value on property "related" with value to add "[[New note]]"
    Then 1 notes are changed
    And note "Note C" has "[[New note]]" in "related"
    And the YAML of "Note C" is still valid

  Scenario: Trying to add a value that already exists, changes nothing
    Given a fresh copy of the test vault
    When I filter notes where "related" "exists and contains" "[[Topic A]]"
    And I apply add value on property "related" with value to add "[[Topic A]]"
    Then 2 notes match
    And 0 notes are changed

  Scenario: Trying add a value to a single-value property that exists and is not empty, does not add the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "time" "exists and contains" "13:40"
    And 1 notes match
    Then I apply add value on property "time" with value to add "23:59"
    And 0 notes are changed
    And note "Note A" has property "time" equal to "13:40"

  Scenario: Adding a value to a single-value property that exists and is empty, adds the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "time" "exists and is empty"
    And 1 notes match
    Then I apply add value on property "time" with value to add "23:59"
    And 1 notes are changed
    And note "Note B" has property "time" equal to "23:59"

Scenario: Adding a value to a single-value property that does not exist, adds the property and the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "time" "does not exist"
    And 1 notes match
    Then I apply add value on property "time" with value to add "23:59"
    And 1 notes are changed
    And note "Note C" has property "time" equal to "23:59"

Scenario: Trying add a link note to a boolean property, does not add the link note
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "read" "exists and contains" "true"
    And 1 notes match
    Then I apply add value on property "read" with value to add "[[Some note]]"
    And 0 notes are changed
    And note "Note A" has property "read" equal to "true"

Scenario: Trying add a plain text value to a link-array property, does not add the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "related" "exists and is empty"
    And 1 notes match
    Then I apply add value on property "related" with value to add "Some plain text"
    And 0 notes are changed
    And note "Note B" has property "related" and it is empty

  Scenario: Adding a value to a property on a note that has no frontmatter creates it
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 3"
    And 2 notes match
    And I apply add value on property "tags" with value to add "newtag"
    Then 2 notes are changed
    And note "Note without YAML" has "newtag" in "tags"
    And note "Note with empty YAML" has "newtag" in "tags"
    And the YAML of "Note without YAML" is still valid

  Scenario: Adding a valid tag to a tag-array property
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I apply add value on property "tags" with value to add "validtag"
    Then 3 notes are changed
    And note "Note A" has "validtag" in "tags"

  Scenario: Adding an invalid tag (containing a space) is rejected
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I apply add value on property "tags" with value to add "bad tag"
    Then 0 notes are changed

  Scenario: Adding a value to a text-array property
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I apply add value on property "aliases" with value to add "alias new"
    Then 3 notes are changed
    And note "Note A" has "alias new" in "aliases"
