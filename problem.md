You must implement an backend in nodejs, which provides http api for generating a list of affiliate links from stored affiliate links in a graph database and also provides api to store affiliate links to a graph databaase.

## Example 1:

> Input: userID, maschineA
> Output: https://localhost:8080/userID/maschine-a
> Explanation: The output url shoud redirect to a affiliate link, which is stored in a graph database

## Example 2:

> Input: userID, maschineA, linkA
> Output: 200
> Explanation: Add a relationship to the graph database, which stores the relationship to the givin inputs

